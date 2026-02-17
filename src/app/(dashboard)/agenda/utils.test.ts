import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getWeekRange,
  timeToMinutes,
  DIAS_SEMANA,
  getHorarioConfig,
  invalidarCacheHorario,
} from "./utils";
import type { createClient } from "@/lib/supabase/server";

function createMockSupabase(tableResponses: Record<string, unknown>) {
  return {
    from: (table: string) => {
      const response = tableResponses[table];
      return {
        select: () => ({
          eq: () => ({
            eq: () => response,
            in: () => response,
          }),
        }),
      };
    },
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

describe("getWeekRange", () => {
  it("Monday input: weekStart is same day, weekEnd is Saturday", () => {
    const result = getWeekRange("2024-01-08"); // Monday
    expect(result.weekStart).toBe("2024-01-08");
    expect(result.weekEnd).toBe("2024-01-13");
  });

  it("Wednesday input: weekStart is Monday of that week", () => {
    const result = getWeekRange("2024-01-10"); // Wednesday
    expect(result.weekStart).toBe("2024-01-08");
  });

  it("Sunday input: weekStart is previous Monday (diffToMonday = -6)", () => {
    const result = getWeekRange("2024-01-14"); // Sunday
    expect(result.weekStart).toBe("2024-01-08");
    expect(result.weekEnd).toBe("2024-01-13");
  });

  it("Saturday input: weekStart is Monday of that week", () => {
    const result = getWeekRange("2024-01-13"); // Saturday
    expect(result.weekStart).toBe("2024-01-08");
    expect(result.weekEnd).toBe("2024-01-13");
  });

  it("returns exactly 6 dates (Mon-Sat)", () => {
    const result = getWeekRange("2024-01-10");
    expect(result.weekDates).toHaveLength(6);
    // First date is Monday, last is Saturday
    const firstDate = new Date(result.weekDates[0] + "T12:00:00");
    expect(firstDate.getDay()).toBe(1); // Monday
    const lastDate = new Date(result.weekDates[5] + "T12:00:00");
    expect(lastDate.getDay()).toBe(6); // Saturday
  });

  it("handles month boundary crossing (2024-01-31 which is a Wednesday)", () => {
    const result = getWeekRange("2024-01-31");
    expect(result.weekStart).toBe("2024-01-29"); // Monday
    expect(result.weekEnd).toBe("2024-02-03"); // Saturday crosses into Feb
    expect(result.weekDates).toContain("2024-01-29");
    expect(result.weekDates).toContain("2024-01-30");
    expect(result.weekDates).toContain("2024-01-31");
    expect(result.weekDates).toContain("2024-02-01");
    expect(result.weekDates).toContain("2024-02-02");
    expect(result.weekDates).toContain("2024-02-03");
  });

  it("handles year boundary crossing (2024-12-30 which is a Monday)", () => {
    const result = getWeekRange("2024-12-30");
    expect(result.weekStart).toBe("2024-12-30");
    expect(result.weekEnd).toBe("2025-01-04");
    expect(result.weekDates).toContain("2025-01-01");
  });

  it("all dates formatted as YYYY-MM-DD", () => {
    const result = getWeekRange("2024-03-05");
    for (const date of result.weekDates) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("timeToMinutes", () => {
  it('"08:00" returns 480', () => {
    expect(timeToMinutes("08:00")).toBe(480);
  });

  it('"00:00" returns 0', () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it('"23:59" returns 1439', () => {
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it('"12:30" returns 750', () => {
    expect(timeToMinutes("12:30")).toBe(750);
  });

  it('"08:00:00" with seconds returns 480 (ignores seconds due to .slice(0, 2))', () => {
    expect(timeToMinutes("08:00:00")).toBe(480);
  });
});

describe("DIAS_SEMANA", () => {
  it("has entries for 0 through 6", () => {
    for (let i = 0; i <= 6; i++) {
      expect(DIAS_SEMANA[i]).toBeDefined();
    }
  });

  it("each entry has key and label properties", () => {
    for (let i = 0; i <= 6; i++) {
      expect(DIAS_SEMANA[i]).toHaveProperty("key");
      expect(DIAS_SEMANA[i]).toHaveProperty("label");
      expect(typeof DIAS_SEMANA[i].key).toBe("string");
      expect(typeof DIAS_SEMANA[i].label).toBe("string");
    }
  });
});

describe("getHorarioConfig", () => {
  const clinicaId = "clinic-123";
  const userId = "user-456";

  beforeEach(() => {
    invalidarCacheHorario(clinicaId, userId);
    invalidarCacheHorario(clinicaId);
  });

  afterEach(() => {
    invalidarCacheHorario(clinicaId, userId);
    invalidarCacheHorario(clinicaId);
  });

  it("returns professional hours when userId provided and rows exist", async () => {
    const mockSupabase = createMockSupabase({
      horarios_profissional: {
        data: [
          {
            dia_semana: 1,
            ativo: true,
            hora_inicio: "08:00",
            hora_fim: "12:00",
            intervalo_inicio: "10:00",
            intervalo_fim: "10:15",
            duracao_consulta: 30,
          },
          {
            dia_semana: 2,
            ativo: true,
            hora_inicio: "09:00",
            hora_fim: "13:00",
            intervalo_inicio: null,
            intervalo_fim: null,
            duracao_consulta: 30,
          },
        ],
      },
    });

    const config = await getHorarioConfig(mockSupabase, clinicaId, userId);

    expect(config["horario_seg_inicio"]).toBe("08:00");
    expect(config["horario_seg_fim"]).toBe("12:00");
    expect(config["intervalo_seg_inicio"]).toBe("10:00");
    expect(config["intervalo_seg_fim"]).toBe("10:15");
    expect(config["horario_ter_inicio"]).toBe("09:00");
    expect(config["horario_ter_fim"]).toBe("13:00");
    expect(config["duracao_consulta"]).toBe("30");
    // Null intervals should not be set
    expect(config["intervalo_ter_inicio"]).toBeUndefined();
    expect(config["intervalo_ter_fim"]).toBeUndefined();
  });

  it("falls back to clinic config when no professional hours", async () => {
    const mockSupabase = createMockSupabase({
      horarios_profissional: { data: [] },
      configuracoes: {
        data: [
          { chave: "horario_seg_inicio", valor: "07:00" },
          { chave: "horario_seg_fim", valor: "17:00" },
          { chave: "duracao_consulta", valor: "45" },
        ],
      },
    });

    const config = await getHorarioConfig(mockSupabase, clinicaId, userId);

    expect(config["horario_seg_inicio"]).toBe("07:00");
    expect(config["horario_seg_fim"]).toBe("17:00");
    expect(config["duracao_consulta"]).toBe("45");
  });

  it("falls back to clinic config when userId not provided", async () => {
    const mockSupabase = createMockSupabase({
      configuracoes: {
        data: [
          { chave: "horario_seg_inicio", valor: "08:00" },
          { chave: "duracao_consulta", valor: "30" },
        ],
      },
    });

    const config = await getHorarioConfig(mockSupabase, clinicaId);

    expect(config["horario_seg_inicio"]).toBe("08:00");
    expect(config["duracao_consulta"]).toBe("30");
  });

  it("caches results (second call returns cached data without querying)", async () => {
    const fromSpy = vi.fn().mockImplementation((table: string) => {
      if (table === "horarios_profissional") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                data: [
                  {
                    dia_semana: 1,
                    ativo: true,
                    hora_inicio: "08:00",
                    hora_fim: "12:00",
                    intervalo_inicio: null,
                    intervalo_fim: null,
                    duracao_consulta: 30,
                  },
                ],
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ data: [] }),
            in: () => ({ data: [] }),
          }),
        }),
      };
    });

    const mockSupabase = { from: fromSpy } as unknown as Awaited<
      ReturnType<typeof createClient>
    >;

    // First call
    const config1 = await getHorarioConfig(mockSupabase, clinicaId, userId);
    expect(config1["horario_seg_inicio"]).toBe("08:00");
    expect(fromSpy).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const config2 = await getHorarioConfig(mockSupabase, clinicaId, userId);
    expect(config2["horario_seg_inicio"]).toBe("08:00");
    expect(fromSpy).toHaveBeenCalledTimes(1); // Not called again
  });

  it("skips inactive days (ativo=false does not set horario keys)", async () => {
    const mockSupabase = createMockSupabase({
      horarios_profissional: {
        data: [
          {
            dia_semana: 1,
            ativo: false,
            hora_inicio: "08:00",
            hora_fim: "12:00",
            intervalo_inicio: null,
            intervalo_fim: null,
            duracao_consulta: 30,
          },
          {
            dia_semana: 2,
            ativo: true,
            hora_inicio: "09:00",
            hora_fim: "13:00",
            intervalo_inicio: null,
            intervalo_fim: null,
            duracao_consulta: 30,
          },
        ],
      },
    });

    const config = await getHorarioConfig(mockSupabase, clinicaId, userId);

    // Monday (seg) is inactive, so no horario keys should be set
    expect(config["horario_seg_inicio"]).toBeUndefined();
    expect(config["horario_seg_fim"]).toBeUndefined();

    // Tuesday (ter) is active, should be set
    expect(config["horario_ter_inicio"]).toBe("09:00");
    expect(config["horario_ter_fim"]).toBe("13:00");
    expect(config["duracao_consulta"]).toBe("30");
  });

  it("handles null rows from supabase gracefully", async () => {
    const mockSupabase = createMockSupabase({
      horarios_profissional: { data: null },
      configuracoes: { data: null },
    });

    const config = await getHorarioConfig(mockSupabase, clinicaId, userId);
    expect(config).toEqual({});
  });
});

describe("invalidarCacheHorario", () => {
  const clinicaId = "clinic-789";
  const userId = "user-012";

  beforeEach(() => {
    invalidarCacheHorario(clinicaId, userId);
    invalidarCacheHorario(clinicaId);
  });

  afterEach(() => {
    invalidarCacheHorario(clinicaId, userId);
    invalidarCacheHorario(clinicaId);
  });

  it("clears specific user cache and clinic cache when userId provided", async () => {
    const fromSpy = vi.fn().mockImplementation((table: string) => {
      if (table === "horarios_profissional") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                data: [
                  {
                    dia_semana: 3,
                    ativo: true,
                    hora_inicio: "10:00",
                    hora_fim: "14:00",
                    intervalo_inicio: null,
                    intervalo_fim: null,
                    duracao_consulta: 20,
                  },
                ],
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ data: [] }),
            in: () => ({ data: [] }),
          }),
        }),
      };
    });

    const mockSupabase = { from: fromSpy } as unknown as Awaited<
      ReturnType<typeof createClient>
    >;

    // Populate cache
    await getHorarioConfig(mockSupabase, clinicaId, userId);
    expect(fromSpy).toHaveBeenCalledTimes(1);

    // Verify cached
    await getHorarioConfig(mockSupabase, clinicaId, userId);
    expect(fromSpy).toHaveBeenCalledTimes(1);

    // Invalidate with userId (clears both user and clinic cache)
    invalidarCacheHorario(clinicaId, userId);

    // Next call should query again
    await getHorarioConfig(mockSupabase, clinicaId, userId);
    expect(fromSpy).toHaveBeenCalledTimes(2);
  });

  it("clears only clinic cache when no userId provided", async () => {
    const fromSpy = vi.fn().mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ data: [] }),
          in: () => ({
            data: [{ chave: "duracao_consulta", valor: "15" }],
          }),
        }),
      }),
    }));

    const mockSupabase = { from: fromSpy } as unknown as Awaited<
      ReturnType<typeof createClient>
    >;

    // Populate clinic cache (no userId)
    await getHorarioConfig(mockSupabase, clinicaId);
    expect(fromSpy).toHaveBeenCalledTimes(1);

    // Verify cached
    await getHorarioConfig(mockSupabase, clinicaId);
    expect(fromSpy).toHaveBeenCalledTimes(1);

    // Invalidate without userId (clears clinic cache only)
    invalidarCacheHorario(clinicaId);

    // Next call should query again
    await getHorarioConfig(mockSupabase, clinicaId);
    expect(fromSpy).toHaveBeenCalledTimes(2);
  });
});
