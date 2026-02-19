-- Tabela para rate limiting persistente (compartilhado entre instâncias)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  first_attempt timestamptz NOT NULL DEFAULT now()
);

-- Sem RLS — acesso apenas via service role (admin client)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Função RPC atômica: verifica e incrementa o rate limit em uma única chamada
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_attempts integer DEFAULT 5,
  p_window_ms integer DEFAULT 900000
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_entry public.rate_limits;
  v_now timestamptz := now();
  v_window interval := make_interval(secs := p_window_ms / 1000.0);
  v_remaining integer;
  v_reset_in integer;
BEGIN
  -- Buscar entrada existente
  SELECT * INTO v_entry FROM public.rate_limits WHERE key = p_key FOR UPDATE;

  IF v_entry IS NULL OR v_now - v_entry.first_attempt > v_window THEN
    -- Sem registro ou janela expirou — permite e reseta
    INSERT INTO public.rate_limits (key, attempts, first_attempt)
    VALUES (p_key, 1, v_now)
    ON CONFLICT (key) DO UPDATE SET attempts = 1, first_attempt = v_now;

    RETURN json_build_object(
      'success', true,
      'remaining', p_max_attempts - 1,
      'resetIn', p_window_ms
    );
  END IF;

  -- Dentro da janela — incrementa
  UPDATE public.rate_limits SET attempts = v_entry.attempts + 1 WHERE key = p_key;

  IF v_entry.attempts + 1 > p_max_attempts THEN
    v_reset_in := p_window_ms - EXTRACT(EPOCH FROM (v_now - v_entry.first_attempt))::integer * 1000;
    RETURN json_build_object('success', false, 'remaining', 0, 'resetIn', GREATEST(v_reset_in, 0));
  END IF;

  v_remaining := p_max_attempts - (v_entry.attempts + 1);
  v_reset_in := p_window_ms - EXTRACT(EPOCH FROM (v_now - v_entry.first_attempt))::integer * 1000;
  RETURN json_build_object('success', true, 'remaining', v_remaining, 'resetIn', GREATEST(v_reset_in, 0));
END;
$$;

-- Limpar entradas expiradas periodicamente (executar via cron ou manualmente)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits(p_max_age_ms integer DEFAULT 3600000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE now() - first_attempt > make_interval(secs := p_max_age_ms / 1000.0);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Acesso restrito ao service role (sem acesso público)
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_rate_limits(integer) FROM PUBLIC;
