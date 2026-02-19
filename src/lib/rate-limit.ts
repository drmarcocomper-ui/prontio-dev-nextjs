/**
 * Rate limiter com persistência no Supabase via RPC `check_rate_limit`.
 * Fallback para Map em memória caso a chamada ao DB falhe.
 *
 * O estado é armazenado na tabela `rate_limits` no Supabase, sendo
 * compartilhado entre múltiplas instâncias e persistente entre deploys.
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

// --- Fallback in-memory ---

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

const store = new Map<string, RateLimitEntry>();

function inMemoryRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    store.set(key, { attempts: 1, firstAttempt: now });
    return { success: true, remaining: maxAttempts - 1, resetIn: windowMs };
  }

  entry.attempts++;

  if (entry.attempts > maxAttempts) {
    const resetIn = windowMs - (now - entry.firstAttempt);
    return { success: false, remaining: 0, resetIn };
  }

  return {
    success: true,
    remaining: maxAttempts - entry.attempts,
    resetIn: windowMs - (now - entry.firstAttempt),
  };
}

// --- Main function ---

export async function rateLimit({
  key,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
}: {
  key: string;
  maxAttempts?: number;
  windowMs?: number;
}): Promise<RateLimitResult> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_max_attempts: maxAttempts,
      p_window_ms: windowMs,
    });

    if (error || !data) {
      return inMemoryRateLimit(key, maxAttempts, windowMs);
    }

    return data as RateLimitResult;
  } catch {
    return inMemoryRateLimit(key, maxAttempts, windowMs);
  }
}
