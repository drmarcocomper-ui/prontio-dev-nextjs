import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockRedirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (data: unknown) => mockInsert(data),
        update: (data: unknown) => ({
          eq: () => mockUpdate(data),
        }),
        delete: () => ({
          eq: (_col: unknown, val: string) => mockDelete(val),
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

import { criarPaciente, atualizarPaciente, excluirPaciente } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("criarPaciente", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna fieldErrors quando nome está vazio", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "" }));
    expect(result.fieldErrors?.nome).toBe("Nome é obrigatório.");
  });

  it("retorna fieldErrors quando CPF é inválido", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "João", cpf: "123" }));
    expect(result.fieldErrors?.cpf).toBe("CPF deve ter 11 dígitos.");
  });

  it("retorna fieldErrors quando email é inválido", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "João", email: "invalido" }));
    expect(result.fieldErrors?.email).toBe("E-mail inválido.");
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarPaciente({}, makeFormData({ nome: "João Silva" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ nome: "João Silva" }));
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes?success=Paciente+cadastrado");
  });

  it("limpa caracteres do CPF e telefone", async () => {
    await expect(
      criarPaciente({}, makeFormData({ nome: "João", cpf: "123.456.789-01", telefone: "(11) 98765-4321" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ cpf: "12345678901", telefone: "11987654321" })
    );
  });

  it("retorna erro de CPF duplicado quando código 23505", async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: "23505" } });
    const result = await criarPaciente({}, makeFormData({ nome: "João" }));
    expect(result.error).toBe("Já existe um paciente com este CPF.");
  });

  it("retorna erro genérico quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await criarPaciente({}, makeFormData({ nome: "João" }));
    expect(result.error).toBe("Erro ao cadastrar paciente. Tente novamente.");
  });
});

describe("atualizarPaciente", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna fieldErrors quando nome está vazio", async () => {
    const result = await atualizarPaciente({}, makeFormData({ id: "p-1", nome: "" }));
    expect(result.fieldErrors?.nome).toBe("Nome é obrigatório.");
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarPaciente({}, makeFormData({ id: "p-1", nome: "Maria" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ nome: "Maria" }));
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes/p-1?success=Paciente+atualizado");
  });

  it("retorna erro de CPF duplicado quando código 23505", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { code: "23505" } });
    const result = await atualizarPaciente({}, makeFormData({ id: "p-1", nome: "Maria" }));
    expect(result.error).toBe("Já existe um paciente com este CPF.");
  });

  it("retorna erro genérico quando update falha", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarPaciente({}, makeFormData({ id: "p-1", nome: "Maria" }));
    expect(result.error).toBe("Erro ao atualizar paciente. Tente novamente.");
  });

  it("retorna fieldErrors quando email é inválido na atualização", async () => {
    const result = await atualizarPaciente({}, makeFormData({ id: "p-1", nome: "Maria", email: "invalido" }));
    expect(result.fieldErrors?.email).toBe("E-mail inválido.");
  });
});

describe("excluirPaciente", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirPaciente("p-1")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("p-1");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes?success=Paciente+exclu%C3%ADdo");
  });

  it("lança erro quando exclusão falha", async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirPaciente("p-1")).rejects.toThrow("Erro ao excluir paciente.");
  });
});
