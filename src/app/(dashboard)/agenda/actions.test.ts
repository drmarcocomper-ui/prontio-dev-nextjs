import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockRedirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (data: unknown) => mockInsert(data),
        update: (data: unknown) => ({
          eq: (_col: string, val: string) => mockUpdateEq(data, val),
        }),
        delete: () => ({
          eq: (_col: string, val: string) => mockDelete(val),
        }),
      }),
    }),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT");
  },
}));

import { criarAgendamento, atualizarAgendamento, atualizarStatusAgendamento, excluirAgendamento } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("criarAgendamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await criarAgendamento({}, makeFormData({ data: "2024-06-15", hora_inicio: "09:00", hora_fim: "09:30" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await criarAgendamento({}, makeFormData({ paciente_id: "p-1", data: "", hora_inicio: "09:00", hora_fim: "09:30" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando hora_fim <= hora_inicio", async () => {
    const result = await criarAgendamento({}, makeFormData({
      paciente_id: "p-1", data: "2024-06-15", hora_inicio: "10:00", hora_fim: "09:00",
    }));
    expect(result.fieldErrors?.hora_fim).toBe("Horário de término deve ser após o início.");
  });

  it("retorna fieldErrors quando hora_inicio está vazia", async () => {
    const result = await criarAgendamento({}, makeFormData({
      paciente_id: "p-1", data: "2024-06-15", hora_inicio: "", hora_fim: "09:30",
    }));
    expect(result.fieldErrors?.hora_inicio).toBe("Horário de início é obrigatório.");
  });

  it("retorna fieldErrors quando hora_fim está vazia", async () => {
    const result = await criarAgendamento({}, makeFormData({
      paciente_id: "p-1", data: "2024-06-15", hora_inicio: "09:00", hora_fim: "",
    }));
    expect(result.fieldErrors?.hora_fim).toBe("Horário de término é obrigatório.");
  });

  it("retorna error quando insert no banco falha", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await criarAgendamento({}, makeFormData({
      paciente_id: "p-1", data: "2024-06-15", hora_inicio: "09:00", hora_fim: "09:30",
    }));
    expect(result.error).toBe("Erro ao criar agendamento. Tente novamente.");
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarAgendamento({}, makeFormData({
        paciente_id: "p-1", data: "2024-06-15", hora_inicio: "09:00", hora_fim: "09:30",
      }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      paciente_id: "p-1",
      data: "2024-06-15",
      status: "agendado",
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/agenda?data=2024-06-15&success=Agendamento+criado");
  });
});

describe("atualizarAgendamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await atualizarAgendamento({}, makeFormData({
      id: "ag-1", data: "2024-06-15", hora_inicio: "09:00", hora_fim: "09:30",
    }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await atualizarAgendamento({}, makeFormData({
      id: "ag-1", paciente_id: "p-1", data: "", hora_inicio: "09:00", hora_fim: "09:30",
    }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando hora_fim <= hora_inicio", async () => {
    const result = await atualizarAgendamento({}, makeFormData({
      id: "ag-1", paciente_id: "p-1", data: "2024-06-15", hora_inicio: "10:00", hora_fim: "09:00",
    }));
    expect(result.fieldErrors?.hora_fim).toBe("Horário de término deve ser após o início.");
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarAgendamento({}, makeFormData({
        id: "ag-1", paciente_id: "p-1", data: "2024-06-15", hora_inicio: "09:00", hora_fim: "09:30",
      }))
    ).rejects.toThrow("REDIRECT");
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
    const result = await atualizarAgendamento({}, makeFormData({
      id: "ag-1", paciente_id: "p-1", data: "2024-06-15", hora_inicio: "09:00", hora_fim: "09:30",
    }));
    expect(result.error).toBe("Erro ao atualizar agendamento. Tente novamente.");
  });
});

describe("atualizarStatusAgendamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atualiza o status do agendamento", async () => {
    await atualizarStatusAgendamento("ag-1", "confirmado");
    expect(mockUpdateEq).toHaveBeenCalledWith({ status: "confirmado" }, "ag-1");
  });

  it("lança erro quando atualização no banco falha", async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(atualizarStatusAgendamento("ag-1", "confirmado")).rejects.toThrow("Erro ao atualizar status.");
  });
});

describe("excluirAgendamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirAgendamento("ag-1", "2024-06-15")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("ag-1");
    expect(mockRedirect).toHaveBeenCalledWith("/agenda?data=2024-06-15&success=Agendamento+exclu%C3%ADdo");
  });

  it("lança erro quando exclusão no banco falha", async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirAgendamento("ag-1", "2024-06-15")).rejects.toThrow("Erro ao excluir agendamento.");
  });
});
