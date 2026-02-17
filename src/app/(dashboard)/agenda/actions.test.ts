import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── mocks de mutation ─────────────────────────────────────────────── */

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockLogInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
const mockRedirect = vi.fn();

/* ── mock da query select (conflito + single + configuracoes) ─────── */

let conflitoResult: { data: unknown[] | null; error: unknown } = {
  data: [],
  error: null,
};

let singleResult: { data: unknown | null; error: unknown } = {
  data: null,
  error: null,
};

let configResult: { data: unknown[] | null; error: unknown } = {
  data: [],
  error: null,
};

let pacienteSingleResult: { data: unknown | null; error: unknown } = {
  data: null,
  error: null,
};

let configSingleResult: { data: unknown | null; error: unknown } = {
  data: null,
  error: null,
};

let profHorarioResult: { data: unknown[] | null; error: unknown } = {
  data: null,
  error: null,
};

function createSelectChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.lt = vi.fn().mockReturnValue(chain);
  chain.gt = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockImplementation(() => conflitoResult);
  chain.single = vi.fn().mockImplementation(() => singleResult);
  return chain;
}

function createConfigChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockImplementation(() => configResult);
  chain.single = vi.fn().mockImplementation(() => configSingleResult);
  return chain;
}

function createPacienteChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockImplementation(() => pacienteSingleResult);
  return chain;
}

let selectChain = createSelectChain();
let configChain = createConfigChain();
let pacienteChain = createPacienteChain();

/* ── mock do Supabase ──────────────────────────────────────────────── */

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "profissional_saude",
    userId: "user-1",
  }),
  getMedicoId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "horarios_profissional") {
          return {
            select: () => ({
              eq: () => ({ eq: () => profHorarioResult }),
            }),
          };
        }
        if (table === "configuracoes") {
          return { select: () => configChain };
        }
        if (table === "pacientes") {
          return { select: () => pacienteChain };
        }
        if (table === "agendamento_status_log") {
          return { insert: (data: unknown) => mockLogInsert(data) };
        }
        return {
          select: () => selectChain,
          insert: (data: unknown) => mockInsert(data),
          update: (data: unknown) => ({
            eq: (_col: string, val: string) => ({
              eq: () => mockUpdateEq(data, val),
            }),
          }),
          delete: () => ({
            eq: (_col: string, val: string) => ({
              eq: () => mockDeleteEq(val),
            }),
          }),
        };
      },
    }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT");
  },
}));

/* ── imports & helpers ─────────────────────────────────────────────── */

import {
  criarAgendamento,
  atualizarAgendamento,
  atualizarStatusAgendamento,
  excluirAgendamento,
} from "./actions";
import { invalidarCacheHorario } from "./utils";
import { STATUS_TRANSITIONS } from "./types";
import { getClinicaAtual } from "@/lib/clinica";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const validCreate = {
  paciente_id: "00000000-0000-0000-0000-000000000001",
  data: "2024-06-15",
  hora_inicio: "09:00",
  tipo: "consulta",
};

const validUpdate = {
  id: "00000000-0000-0000-0000-000000000007",
  ...validCreate,
};

/* ── criarAgendamento ──────────────────────────────────────────────── */

describe("criarAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidarCacheHorario("clinic-1");
    invalidarCacheHorario("clinic-1", "user-1");
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    conflitoResult = { data: [], error: null };
    configResult = { data: [], error: null };
    pacienteSingleResult = { data: null, error: null };
    configSingleResult = { data: null, error: null };
    profHorarioResult = {
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        dia_semana: d,
        ativo: d !== 0,
        hora_inicio: "08:00",
        hora_fim: "18:00",
        intervalo_inicio: null,
        intervalo_fim: null,
        duracao_consulta: 15,
      })),
      error: null,
    };
    selectChain = createSelectChain();
    configChain = createConfigChain();
    pacienteChain = createPacienteChain();
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await criarAgendamento(
      {},
      makeFormData({ data: "2024-06-15", hora_inicio: "09:00" })
    );
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await criarAgendamento(
      {},
      makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "", hora_inicio: "09:00" })
    );
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando hora_inicio está vazia", async () => {
    const result = await criarAgendamento(
      {},
      makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", hora_inicio: "" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe("Horário de início é obrigatório.");
  });

  it("calcula hora_fim automaticamente como hora_inicio + 15 minutos (padrão)", async () => {
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        hora_inicio: "09:00",
        hora_fim: "09:15",
      })
    );
  });

  it("usa duracao_consulta do config quando configurado", async () => {
    invalidarCacheHorario("clinic-1", "user-1");
    profHorarioResult = {
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        dia_semana: d,
        ativo: d !== 0,
        hora_inicio: "08:00",
        hora_fim: "18:00",
        intervalo_inicio: null,
        intervalo_fim: null,
        duracao_consulta: 45,
      })),
      error: null,
    };
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        hora_inicio: "09:00",
        hora_fim: "09:45",
      })
    );
  });

  it("retorna fieldError de conflito quando há sobreposição de horário", async () => {
    conflitoResult = {
      data: [
        {
          id: "00000000-0000-0000-0000-000000000008",
          hora_inicio: "09:00:00",
          hora_fim: "09:30:00",
          pacientes: { nome: "Maria Silva" },
        },
      ],
      error: null,
    };

    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, hora_inicio: "09:15" })
    );
    expect(result.conflito).toBe(
      "Conflito com agendamento de Maria Silva (09:00–09:30)."
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("mostra fallback quando conflito não tem nome de paciente", async () => {
    conflitoResult = {
      data: [
        {
          id: "00000000-0000-0000-0000-00000000000a",
          hora_inicio: "08:00:00",
          hora_fim: "08:30:00",
          pacientes: null,
        },
      ],
      error: null,
    };

    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, hora_inicio: "08:00" })
    );
    expect(result.conflito).toBe(
      "Conflito com agendamento de outro paciente (08:00–08:30)."
    );
  });

  it("determina valor null quando paciente não tem convênio", async () => {
    pacienteSingleResult = { data: { convenio: null }, error: null };
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ valor: null })
    );
  });

  it("determina valor 0 quando tipo é retorno", async () => {
    await expect(criarAgendamento({}, makeFormData({ ...validCreate, tipo: "retorno" }))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ valor: 0 })
    );
  });

  it("determina valor 0 quando convênio é cortesia", async () => {
    pacienteSingleResult = { data: { convenio: "cortesia" }, error: null };
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ valor: 0 })
    );
  });

  it("determina valor do convênio quando configurado", async () => {
    pacienteSingleResult = { data: { convenio: "bradesco" }, error: null };
    configSingleResult = { data: { valor: "350.00" }, error: null };
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ valor: 350 })
    );
  });

  it("permite agendamento quando não há conflito", async () => {
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        paciente_id: "00000000-0000-0000-0000-000000000001",
        data: "2024-06-15",
        status: "agendado",
      })
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      "/agenda?data=2024-06-15&success=Agendamento+criado"
    );
  });

  it("consulta conflitos filtrando por data e sobreposição de horário", async () => {
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(selectChain.eq).toHaveBeenCalledWith("data", "2024-06-15");
    expect(selectChain.lt).toHaveBeenCalledWith("hora_inicio", "09:15");
    expect(selectChain.gt).toHaveBeenCalledWith("hora_fim", "09:00");
    expect(selectChain.not).toHaveBeenCalledWith("status", "in", "(cancelado,faltou)");
    expect(selectChain.limit).toHaveBeenCalledWith(1);
  });

  it("retorna error quando insert no banco falha", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await criarAgendamento({}, makeFormData(validCreate));
    expect(result.error).toBe("Erro ao criar agendamento. Tente novamente.");
  });

  it("bloqueia agendamento fora do horário comercial configurado", async () => {
    invalidarCacheHorario("clinic-1", "user-1");
    profHorarioResult = {
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        dia_semana: d,
        ativo: d === 6,
        hora_inicio: d === 6 ? "09:00" : "08:00",
        hora_fim: d === 6 ? "12:00" : "18:00",
        intervalo_inicio: null,
        intervalo_fim: null,
        duracao_consulta: 15,
      })),
      error: null,
    };

    // 2024-06-15 is Saturday, configured 09:00-12:00, trying 14:00-14:15
    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, hora_inicio: "14:00" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Horário fora do expediente de sábado (09:00–12:00)."
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("bloqueia agendamento aos domingos", async () => {
    // Default profHorarioResult has domingo (day 0) as ativo: false
    // 2024-06-16 is Sunday
    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, data: "2024-06-16" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe("O profissional não atende neste dia (domingo).");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("usa horário padrão 08:00-18:00 quando não há configuração", async () => {
    // Default profHorarioResult has sab 08:00-18:00, trying 07:00-07:15
    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, hora_inicio: "07:00" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Horário fora do expediente de sábado (08:00–18:00)."
    );
  });

  it("permite agendamento dentro do horário comercial", async () => {
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("retorna erro quando getClinicaAtual retorna null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await criarAgendamento({}, makeFormData(validCreate));
    expect(result.error).toBe("Clínica não selecionada.");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

/* ── atualizarAgendamento ──────────────────────────────────────────── */

describe("atualizarAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidarCacheHorario("clinic-1");
    invalidarCacheHorario("clinic-1", "user-1");
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    conflitoResult = { data: [], error: null };
    configResult = { data: [], error: null };
    pacienteSingleResult = { data: null, error: null };
    configSingleResult = { data: null, error: null };
    profHorarioResult = {
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        dia_semana: d,
        ativo: d !== 0,
        hora_inicio: "08:00",
        hora_fim: "18:00",
        intervalo_inicio: null,
        intervalo_fim: null,
        duracao_consulta: 15,
      })),
      error: null,
    };
    selectChain = createSelectChain();
    configChain = createConfigChain();
    pacienteChain = createPacienteChain();
  });

  it("retorna erro quando ID é inválido", async () => {
    const result = await atualizarAgendamento(
      {},
      makeFormData({ id: "invalido", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", hora_inicio: "09:00" })
    );
    expect(result.error).toBe("ID inválido.");
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await atualizarAgendamento(
      {},
      makeFormData({ id: "00000000-0000-0000-0000-000000000007", data: "2024-06-15", hora_inicio: "09:00" })
    );
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await atualizarAgendamento(
      {},
      makeFormData({
        id: "00000000-0000-0000-0000-000000000007",
        paciente_id: "00000000-0000-0000-0000-000000000001",
        data: "",
        hora_inicio: "09:00",
      })
    );
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldError de conflito quando há sobreposição de horário", async () => {
    conflitoResult = {
      data: [
        {
          id: "00000000-0000-0000-0000-000000000009",
          hora_inicio: "09:00:00",
          hora_fim: "10:00:00",
          pacientes: { nome: "João Santos" },
        },
      ],
      error: null,
    };

    const result = await atualizarAgendamento(
      {},
      makeFormData({ ...validUpdate, hora_inicio: "09:30" })
    );
    expect(result.conflito).toBe(
      "Conflito com agendamento de João Santos (09:00–10:00)."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("exclui o próprio agendamento da verificação de conflito (neq)", async () => {
    await expect(atualizarAgendamento({}, makeFormData(validUpdate))).rejects.toThrow("REDIRECT");
    expect(selectChain.neq).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000007");
  });

  it("não usa neq na criação (sem excluirId)", async () => {
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(selectChain.neq).not.toHaveBeenCalled();
  });

  it("determina valor do convênio na atualização", async () => {
    pacienteSingleResult = { data: { convenio: "unimed" }, error: null };
    configSingleResult = { data: { valor: "250.00" }, error: null };
    await expect(atualizarAgendamento({}, makeFormData(validUpdate))).rejects.toThrow("REDIRECT");
    expect(mockUpdateEq).toHaveBeenCalledWith(
      expect.objectContaining({ valor: 250 }),
      "00000000-0000-0000-0000-000000000007"
    );
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(atualizarAgendamento({}, makeFormData(validUpdate))).rejects.toThrow("REDIRECT");
    expect(mockUpdateEq).toHaveBeenCalledWith(
      expect.objectContaining({
        paciente_id: "00000000-0000-0000-0000-000000000001",
        data: "2024-06-15",
        hora_inicio: "09:00",
        hora_fim: "09:15",
      }),
      "00000000-0000-0000-0000-000000000007"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/agenda/00000000-0000-0000-0000-000000000007?success=Agendamento+atualizado");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarAgendamento({}, makeFormData(validUpdate));
    expect(result.error).toBe("Erro ao atualizar agendamento. Tente novamente.");
  });

  it("bloqueia atualização fora do horário comercial", async () => {
    invalidarCacheHorario("clinic-1", "user-1");
    profHorarioResult = {
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        dia_semana: d,
        ativo: d === 6,
        hora_inicio: d === 6 ? "09:00" : "08:00",
        hora_fim: d === 6 ? "12:00" : "18:00",
        intervalo_inicio: null,
        intervalo_fim: null,
        duracao_consulta: 15,
      })),
      error: null,
    };

    const result = await atualizarAgendamento(
      {},
      makeFormData({ ...validUpdate, hora_inicio: "14:00" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Horário fora do expediente de sábado (09:00–12:00)."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("retorna erro quando getClinicaAtual retorna null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await atualizarAgendamento(
      {},
      makeFormData(validUpdate)
    );
    expect(result.error).toBe("Clínica não selecionada.");
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });
});

/* ── atualizarStatusAgendamento ────────────────────────────────────── */

describe("atualizarStatusAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateEq.mockResolvedValue({ error: null });
    selectChain = createSelectChain();
    singleResult = { data: { status: "agendado" }, error: null };
  });

  it("permite transição agendado → confirmado", async () => {
    singleResult = { data: { status: "agendado" }, error: null };
    await atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "confirmado");
    expect(mockUpdateEq).toHaveBeenCalledWith(expect.objectContaining({ status: "confirmado" }), "00000000-0000-0000-0000-000000000007");
  });

  it("permite transição confirmado → em_atendimento", async () => {
    singleResult = { data: { status: "confirmado" }, error: null };
    await atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "em_atendimento");
    expect(mockUpdateEq).toHaveBeenCalledWith(expect.objectContaining({ status: "em_atendimento" }), "00000000-0000-0000-0000-000000000007");
  });

  it("permite transição em_atendimento → atendido", async () => {
    singleResult = { data: { status: "em_atendimento" }, error: null };
    await atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "atendido");
    expect(mockUpdateEq).toHaveBeenCalledWith(expect.objectContaining({ status: "atendido" }), "00000000-0000-0000-0000-000000000007");
  });

  it("permite transição cancelado → agendado (reagendar)", async () => {
    singleResult = { data: { status: "cancelado" }, error: null };
    await atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "agendado");
    expect(mockUpdateEq).toHaveBeenCalledWith(expect.objectContaining({ status: "agendado" }), "00000000-0000-0000-0000-000000000007");
  });

  it("permite transição faltou → agendado (reagendar)", async () => {
    singleResult = { data: { status: "faltou" }, error: null };
    await atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "agendado");
    expect(mockUpdateEq).toHaveBeenCalledWith(expect.objectContaining({ status: "agendado" }), "00000000-0000-0000-0000-000000000007");
  });

  it("bloqueia transição atendido → confirmado (status terminal)", async () => {
    singleResult = { data: { status: "atendido" }, error: null };
    await expect(atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "confirmado")).rejects.toThrow(
      "Transição de status não permitida."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("bloqueia transição faltou → confirmado", async () => {
    singleResult = { data: { status: "faltou" }, error: null };
    await expect(atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "confirmado")).rejects.toThrow(
      "Transição de status não permitida."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("bloqueia transição agendado → atendido (pula etapas)", async () => {
    singleResult = { data: { status: "agendado" }, error: null };
    await expect(atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "atendido")).rejects.toThrow(
      "Transição de status não permitida."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("lança erro quando agendamento não encontrado", async () => {
    singleResult = { data: null, error: null };
    await expect(atualizarStatusAgendamento("00000000-0000-0000-0000-00000000000a", "confirmado")).rejects.toThrow(
      "Agendamento não encontrado."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("lança erro quando atualização no banco falha", async () => {
    singleResult = { data: { status: "agendado" }, error: null };
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "confirmado")).rejects.toThrow(
      "Erro ao atualizar status."
    );
  });

  it("insere log de auditoria após mudança de status", async () => {
    singleResult = { data: { status: "agendado" }, error: null };
    await atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "confirmado");
    expect(mockLogInsert).toHaveBeenCalledWith({
      agendamento_id: "00000000-0000-0000-0000-000000000007",
      status_anterior: "agendado",
      status_novo: "confirmado",
      user_id: "user-1",
    });
  });

  it("não insere log quando transição é bloqueada", async () => {
    singleResult = { data: { status: "atendido" }, error: null };
    await expect(atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "confirmado")).rejects.toThrow();
    expect(mockLogInsert).not.toHaveBeenCalled();
  });

  it("lança erro quando getClinicaAtual retorna null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    await expect(
      atualizarStatusAgendamento("00000000-0000-0000-0000-000000000007", "confirmado")
    ).rejects.toThrow("Clínica não selecionada.");
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });
});

/* ── STATUS_TRANSITIONS ────────────────────────────────────────────── */

describe("STATUS_TRANSITIONS", () => {
  it("agendado pode ir para confirmado, cancelado, faltou", () => {
    expect(STATUS_TRANSITIONS.agendado).toEqual(["confirmado", "cancelado", "faltou"]);
  });

  it("confirmado pode ir para em_atendimento, cancelado, faltou", () => {
    expect(STATUS_TRANSITIONS.confirmado).toEqual(["em_atendimento", "cancelado", "faltou"]);
  });

  it("em_atendimento pode ir para atendido, cancelado", () => {
    expect(STATUS_TRANSITIONS.em_atendimento).toEqual(["atendido", "cancelado"]);
  });

  it("atendido é terminal (sem transições)", () => {
    expect(STATUS_TRANSITIONS.atendido).toEqual([]);
  });

  it("cancelado pode voltar para agendado", () => {
    expect(STATUS_TRANSITIONS.cancelado).toEqual(["agendado"]);
  });

  it("faltou pode voltar para agendado", () => {
    expect(STATUS_TRANSITIONS.faltou).toEqual(["agendado"]);
  });
});

/* ── excluirAgendamento ────────────────────────────────────────────── */

describe("excluirAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteEq.mockResolvedValue({ error: null });
  });

  it("lança erro quando ID é inválido", async () => {
    await expect(excluirAgendamento("invalido", "2024-06-15")).rejects.toThrow("ID inválido.");
  });

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirAgendamento("00000000-0000-0000-0000-000000000007", "2024-06-15")).rejects.toThrow("REDIRECT");
    expect(mockDeleteEq).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000007");
    expect(mockRedirect).toHaveBeenCalledWith(
      "/agenda?data=2024-06-15&success=Agendamento+exclu%C3%ADdo"
    );
  });

  it("lança erro quando exclusão no banco falha", async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirAgendamento("00000000-0000-0000-0000-000000000007", "2024-06-15")).rejects.toThrow(
      "Erro ao excluir agendamento."
    );
  });

  it("lança erro quando getClinicaAtual retorna null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    await expect(
      excluirAgendamento("00000000-0000-0000-0000-000000000007", "2024-06-15")
    ).rejects.toThrow("Clínica não selecionada.");
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });
});
