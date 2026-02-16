import { createClient } from "@/lib/supabase/server";

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").slice(0, 2).map(Number);
  return h * 60 + m;
}

export const DIAS_SEMANA: Record<number, { key: string; label: string }> = {
  1: { key: "seg", label: "segunda-feira" },
  2: { key: "ter", label: "terça-feira" },
  3: { key: "qua", label: "quarta-feira" },
  4: { key: "qui", label: "quinta-feira" },
  5: { key: "sex", label: "sexta-feira" },
  6: { key: "sab", label: "sábado" },
};

// Cache de configurações de horário comercial (TTL 5 min)
const HORARIO_CACHE_TTL = 5 * 60 * 1000;
const horarioCache = new Map<string, { data: Record<string, string>; timestamp: number }>();

export async function getHorarioConfig(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicaId: string,
): Promise<Record<string, string>> {
  const cached = horarioCache.get(clinicaId);
  if (cached && Date.now() - cached.timestamp < HORARIO_CACHE_TTL) {
    return cached.data;
  }

  const allKeys = [
    ...Object.values(DIAS_SEMANA).flatMap((d) => [
      `horario_${d.key}_inicio`,
      `horario_${d.key}_fim`,
    ]),
    "duracao_consulta",
    "intervalo_inicio",
    "intervalo_fim",
  ];

  const { data: rows } = await supabase
    .from("configuracoes")
    .select("chave, valor")
    .eq("clinica_id", clinicaId)
    .in("chave", allKeys);

  const config: Record<string, string> = {};
  (rows ?? []).forEach((r: { chave: string; valor: string }) => {
    config[r.chave] = r.valor;
  });

  horarioCache.set(clinicaId, { data: config, timestamp: Date.now() });
  return config;
}

export function invalidarCacheHorario(clinicaId: string) {
  horarioCache.delete(clinicaId);
}
