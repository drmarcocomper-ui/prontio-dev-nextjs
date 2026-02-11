import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockUpdateEq = vi.fn();
const mockDelete = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (data: unknown) => {
          mockInsert(data);
          return Promise.resolve({ error: null });
        },
        update: (data: unknown) => ({
          eq: (_col: string, val: string) => {
            mockUpdateEq(data, val);
            return Promise.resolve({ error: null });
          },
        }),
        delete: () => ({
          eq: (_col: string, val: string) => {
            mockDelete(val);
            return Promise.resolve({ error: null });
          },
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

import { criarAgendamento, atualizarStatusAgendamento, excluirAgendamento } from "./actions";

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

describe("atualizarStatusAgendamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atualiza o status do agendamento", async () => {
    await atualizarStatusAgendamento("ag-1", "confirmado");
    expect(mockUpdateEq).toHaveBeenCalledWith({ status: "confirmado" }, "ag-1");
  });
});

describe("excluirAgendamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirAgendamento("ag-1", "2024-06-15")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("ag-1");
    expect(mockRedirect).toHaveBeenCalledWith("/agenda?data=2024-06-15&success=Agendamento+exclu%C3%ADdo");
  });
});
