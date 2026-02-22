import { type SupabaseServer } from "@/lib/supabase/server";

export interface HorarioProfissional {
  dia_semana: number;
  ativo: boolean;
  hora_inicio: string | null;
  hora_fim: string | null;
  intervalo_inicio: string | null;
  intervalo_fim: string | null;
  duracao_consulta: number;
}

export function getWeekRange(dateStr: string): {
  weekStart: string;
  weekEnd: string;
  weekDates: string[];
} {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  const dow = date.getDay(); // 0=Sun … 6=Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;

  const monday = new Date(date);
  monday.setDate(monday.getDate() + diffToMonday);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(cur.getDate() + i);
    const yy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, "0");
    const dd = String(cur.getDate()).padStart(2, "0");
    weekDates.push(`${yy}-${mm}-${dd}`);
  }

  return { weekStart: weekDates[0], weekEnd: weekDates[6], weekDates };
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").slice(0, 2).map(Number);
  return h * 60 + m;
}

export const DIAS_SEMANA: Record<number, { key: string; label: string }> = {
  0: { key: "dom", label: "domingo" },
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
  supabase: SupabaseServer,
  clinicaId: string,
  userId?: string,
): Promise<Record<string, string>> {
  const cacheKey = `${clinicaId}:${userId ?? "clinic"}`;
  const cached = horarioCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < HORARIO_CACHE_TTL) {
    return cached.data;
  }

  // Se userId fornecido, tentar buscar horários do profissional primeiro
  if (userId) {
    const { data: rows } = await supabase
      .from("horarios_profissional")
      .select("dia_semana, ativo, hora_inicio, hora_fim, intervalo_inicio, intervalo_fim, duracao_consulta")
      .eq("clinica_id", clinicaId)
      .eq("user_id", userId);

    if (rows && rows.length > 0) {
      const config: Record<string, string> = {};
      for (const row of rows as HorarioProfissional[]) {
        const dia = DIAS_SEMANA[row.dia_semana];
        if (!dia) continue;
        if (row.ativo) {
          if (row.hora_inicio) config[`horario_${dia.key}_inicio`] = row.hora_inicio;
          if (row.hora_fim) config[`horario_${dia.key}_fim`] = row.hora_fim;
          if (row.intervalo_inicio) config[`intervalo_${dia.key}_inicio`] = row.intervalo_inicio;
          if (row.intervalo_fim) config[`intervalo_${dia.key}_fim`] = row.intervalo_fim;
        }
        // dia inativo: não seta horario_*_inicio/fim → dia sem expediente
        config.duracao_consulta = String(row.duracao_consulta);
      }
      horarioCache.set(cacheKey, { data: config, timestamp: Date.now() });
      return config;
    }
  }

  // Fallback: buscar da tabela configuracoes (horário da clínica)
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

  horarioCache.set(cacheKey, { data: config, timestamp: Date.now() });
  return config;
}

export function invalidarCacheHorario(clinicaId: string, userId?: string) {
  if (userId) {
    horarioCache.delete(`${clinicaId}:${userId}`);
  }
  horarioCache.delete(`${clinicaId}:clinic`);
}
