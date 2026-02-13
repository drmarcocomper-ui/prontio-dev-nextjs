import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── mocks de mutation ─────────────────────────────────────────────── */

const mockInsert = vi.fn().mockResolvedValue({ error: null });
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
  return chain;
}

let selectChain = createSelectChain();
let configChain = createConfigChain();

/* ── mock do Supabase ──────────────────────────────────────────────── */

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "medico",
    userId: "user-1",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "configuracoes") {
          return { select: () => configChain };
        }
        return {
          select: () => selectChain,
          insert: (data: unknown) => mockInsert(data),
          update: (data: unknown) => ({
            eq: (_col: string, val: string) => mockUpdateEq(data, val),
          }),
          delete: () => ({
            eq: (_col: string, val: string) => mockDeleteEq(val),
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
import { STATUS_TRANSITIONS } from "./types";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const validCreate = {
  paciente_id: "p-1",
  data: "2024-06-15",
  hora_inicio: "09:00",
  hora_fim: "09:30",
};

const validUpdate = {
  id: "ag-1",
  ...validCreate,
};

/* ── criarAgendamento ──────────────────────────────────────────────── */

describe("criarAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    conflitoResult = { data: [], error: null };
    configResult = { data: [], error: null };
    selectChain = createSelectChain();
    configChain = createConfigChain();
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await criarAgendamento(
      {},
      makeFormData({ data: "2024-06-15", hora_inicio: "09:00", hora_fim: "09:30" })
    );
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await criarAgendamento(
      {},
      makeFormData({ paciente_id: "p-1", data: "", hora_inicio: "09:00", hora_fim: "09:30" })
    );
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando hora_fim <= hora_inicio", async () => {
    const result = await criarAgendamento(
      {},
      makeFormData({
        paciente_id: "p-1",
        data: "2024-06-15",
        hora_inicio: "10:00",
        hora_fim: "09:00",
      })
    );
    expect(result.fieldErrors?.hora_fim).toBe("Horário de término deve ser após o início.");
  });

  it("retorna fieldErrors quando hora_inicio está vazia", async () => {
    const result = await criarAgendamento(
      {},
      makeFormData({ paciente_id: "p-1", data: "2024-06-15", hora_inicio: "", hora_fim: "09:30" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe("Horário de início é obrigatório.");
  });

  it("retorna fieldErrors quando hora_fim está vazia", async () => {
    const result = await criarAgendamento(
      {},
      makeFormData({ paciente_id: "p-1", data: "2024-06-15", hora_inicio: "09:00", hora_fim: "" })
    );
    expect(result.fieldErrors?.hora_fim).toBe("Horário de término é obrigatório.");
  });

  it("retorna fieldError de conflito quando há sobreposição de horário", async () => {
    conflitoResult = {
      data: [
        {
          id: "ag-existente",
          hora_inicio: "09:00:00",
          hora_fim: "09:30:00",
          pacientes: { nome: "Maria Silva" },
        },
      ],
      error: null,
    };

    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, hora_inicio: "09:15", hora_fim: "09:45" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Conflito com agendamento de Maria Silva (09:00–09:30)."
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("mostra fallback quando conflito não tem nome de paciente", async () => {
    conflitoResult = {
      data: [
        {
          id: "ag-x",
          hora_inicio: "08:00:00",
          hora_fim: "08:30:00",
          pacientes: null,
        },
      ],
      error: null,
    };

    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, hora_inicio: "08:00", hora_fim: "08:30" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Conflito com agendamento de outro paciente (08:00–08:30)."
    );
  });

  it("permite agendamento quando não há conflito", async () => {
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        paciente_id: "p-1",
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
    expect(selectChain.lt).toHaveBeenCalledWith("hora_inicio", "09:30");
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
    configResult = {
      data: [
        { chave: "horario_sab_inicio", valor: "09:00" },
        { chave: "horario_sab_fim", valor: "12:00" },
      ],
      error: null,
    };

    // 2024-06-15 is Saturday, configured 09:00-12:00, trying 14:00-14:30
    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, hora_inicio: "14:00", hora_fim: "14:30" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Horário fora do expediente de sábado (09:00–12:00)."
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("bloqueia agendamento aos domingos", async () => {
    // 2024-06-16 is Sunday
    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, data: "2024-06-16" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe("Não há expediente aos domingos.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("usa horário padrão 08:00-18:00 quando não há configuração", async () => {
    configResult = { data: [], error: null };

    // 2024-06-15 is Saturday, default 08:00-18:00, trying 07:00-07:30
    const result = await criarAgendamento(
      {},
      makeFormData({ ...validCreate, hora_inicio: "07:00", hora_fim: "07:30" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Horário fora do expediente de sábado (08:00–18:00)."
    );
  });

  it("permite agendamento dentro do horário comercial", async () => {
    configResult = {
      data: [
        { chave: "horario_sab_inicio", valor: "08:00" },
        { chave: "horario_sab_fim", valor: "18:00" },
      ],
      error: null,
    };

    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalled();
  });
});

/* ── atualizarAgendamento ──────────────────────────────────────────── */

describe("atualizarAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    conflitoResult = { data: [], error: null };
    configResult = { data: [], error: null };
    selectChain = createSelectChain();
    configChain = createConfigChain();
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await atualizarAgendamento(
      {},
      makeFormData({ id: "ag-1", data: "2024-06-15", hora_inicio: "09:00", hora_fim: "09:30" })
    );
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await atualizarAgendamento(
      {},
      makeFormData({
        id: "ag-1",
        paciente_id: "p-1",
        data: "",
        hora_inicio: "09:00",
        hora_fim: "09:30",
      })
    );
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando hora_fim <= hora_inicio", async () => {
    const result = await atualizarAgendamento(
      {},
      makeFormData({
        id: "ag-1",
        paciente_id: "p-1",
        data: "2024-06-15",
        hora_inicio: "10:00",
        hora_fim: "09:00",
      })
    );
    expect(result.fieldErrors?.hora_fim).toBe("Horário de término deve ser após o início.");
  });

  it("retorna fieldError de conflito quando há sobreposição de horário", async () => {
    conflitoResult = {
      data: [
        {
          id: "ag-outro",
          hora_inicio: "09:00:00",
          hora_fim: "10:00:00",
          pacientes: { nome: "João Santos" },
        },
      ],
      error: null,
    };

    const result = await atualizarAgendamento(
      {},
      makeFormData({ ...validUpdate, hora_inicio: "09:30", hora_fim: "10:30" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Conflito com agendamento de João Santos (09:00–10:00)."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("exclui o próprio agendamento da verificação de conflito (neq)", async () => {
    await expect(atualizarAgendamento({}, makeFormData(validUpdate))).rejects.toThrow("REDIRECT");
    expect(selectChain.neq).toHaveBeenCalledWith("id", "ag-1");
  });

  it("não usa neq na criação (sem excluirId)", async () => {
    await expect(criarAgendamento({}, makeFormData(validCreate))).rejects.toThrow("REDIRECT");
    expect(selectChain.neq).not.toHaveBeenCalled();
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(atualizarAgendamento({}, makeFormData(validUpdate))).rejects.toThrow("REDIRECT");
    expect(mockUpdateEq).toHaveBeenCalledWith(
      expect.objectContaining({
        paciente_id: "p-1",
        data: "2024-06-15",
        hora_inicio: "09:00",
        hora_fim: "09:30",
      }),
      "ag-1"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/agenda/ag-1?success=Agendamento+atualizado");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarAgendamento({}, makeFormData(validUpdate));
    expect(result.error).toBe("Erro ao atualizar agendamento. Tente novamente.");
  });

  it("bloqueia atualização fora do horário comercial", async () => {
    configResult = {
      data: [
        { chave: "horario_sab_inicio", valor: "09:00" },
        { chave: "horario_sab_fim", valor: "12:00" },
      ],
      error: null,
    };

    const result = await atualizarAgendamento(
      {},
      makeFormData({ ...validUpdate, hora_inicio: "14:00", hora_fim: "14:30" })
    );
    expect(result.fieldErrors?.hora_inicio).toBe(
      "Horário fora do expediente de sábado (09:00–12:00)."
    );
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
    await atualizarStatusAgendamento("ag-1", "confirmado");
    expect(mockUpdateEq).toHaveBeenCalledWith({ status: "confirmado" }, "ag-1");
  });

  it("permite transição confirmado → em_atendimento", async () => {
    singleResult = { data: { status: "confirmado" }, error: null };
    await atualizarStatusAgendamento("ag-1", "em_atendimento");
    expect(mockUpdateEq).toHaveBeenCalledWith({ status: "em_atendimento" }, "ag-1");
  });

  it("permite transição em_atendimento → atendido", async () => {
    singleResult = { data: { status: "em_atendimento" }, error: null };
    await atualizarStatusAgendamento("ag-1", "atendido");
    expect(mockUpdateEq).toHaveBeenCalledWith({ status: "atendido" }, "ag-1");
  });

  it("permite transição cancelado → agendado (reagendar)", async () => {
    singleResult = { data: { status: "cancelado" }, error: null };
    await atualizarStatusAgendamento("ag-1", "agendado");
    expect(mockUpdateEq).toHaveBeenCalledWith({ status: "agendado" }, "ag-1");
  });

  it("permite transição faltou → agendado (reagendar)", async () => {
    singleResult = { data: { status: "faltou" }, error: null };
    await atualizarStatusAgendamento("ag-1", "agendado");
    expect(mockUpdateEq).toHaveBeenCalledWith({ status: "agendado" }, "ag-1");
  });

  it("bloqueia transição atendido → confirmado (status terminal)", async () => {
    singleResult = { data: { status: "atendido" }, error: null };
    await expect(atualizarStatusAgendamento("ag-1", "confirmado")).rejects.toThrow(
      "Transição de status não permitida."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("bloqueia transição faltou → confirmado", async () => {
    singleResult = { data: { status: "faltou" }, error: null };
    await expect(atualizarStatusAgendamento("ag-1", "confirmado")).rejects.toThrow(
      "Transição de status não permitida."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("bloqueia transição agendado → atendido (pula etapas)", async () => {
    singleResult = { data: { status: "agendado" }, error: null };
    await expect(atualizarStatusAgendamento("ag-1", "atendido")).rejects.toThrow(
      "Transição de status não permitida."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("lança erro quando agendamento não encontrado", async () => {
    singleResult = { data: null, error: null };
    await expect(atualizarStatusAgendamento("ag-x", "confirmado")).rejects.toThrow(
      "Agendamento não encontrado."
    );
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("lança erro quando atualização no banco falha", async () => {
    singleResult = { data: { status: "agendado" }, error: null };
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(atualizarStatusAgendamento("ag-1", "confirmado")).rejects.toThrow(
      "Erro ao atualizar status."
    );
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

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirAgendamento("ag-1", "2024-06-15")).rejects.toThrow("REDIRECT");
    expect(mockDeleteEq).toHaveBeenCalledWith("ag-1");
    expect(mockRedirect).toHaveBeenCalledWith(
      "/agenda?data=2024-06-15&success=Agendamento+exclu%C3%ADdo"
    );
  });

  it("lança erro quando exclusão no banco falha", async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirAgendamento("ag-1", "2024-06-15")).rejects.toThrow(
      "Erro ao excluir agendamento."
    );
  });
});
