import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockRedirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (data: unknown) => {
          mockInsert(data);
          return mockInsert.mock.results[mockInsert.mock.results.length - 1].value;
        },
        update: (data: unknown) => ({
          eq: (_col: string, val: string) => mockUpdateEq(data, val),
        }),
        delete: () => ({
          eq: (_col: string, val: string) => mockDelete(val),
        }),
      }),
    }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT");
  },
}));

import { criarTransacao, atualizarTransacao, excluirTransacao } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("criarTransacao", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna fieldErrors quando tipo está vazio", async () => {
    const result = await criarTransacao({}, makeFormData({ descricao: "Teste", valor: "100,00", data: "2024-06-15" }));
    expect(result.fieldErrors?.tipo).toBe("Selecione o tipo.");
  });

  it("retorna fieldErrors quando descrição está vazia", async () => {
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "", valor: "100,00", data: "2024-06-15" }));
    expect(result.fieldErrors?.descricao).toBe("Descrição é obrigatória.");
  });

  it("retorna fieldErrors quando valor é inválido", async () => {
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Teste", valor: "0", data: "2024-06-15" }));
    expect(result.fieldErrors?.valor).toBe("Informe um valor válido.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Teste", valor: "100,00", data: "" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("converte valor monetário corretamente", async () => {
    await expect(
      criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Consulta", valor: "1.350,00", data: "2024-06-15" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ valor: 1350 }));
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Consulta", valor: "350,00", data: "2024-06-15" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      tipo: "receita",
      descricao: "Consulta",
      valor: 350,
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/financeiro?success=Transa%C3%A7%C3%A3o+registrada");
  });

  it("retorna fieldErrors quando descrição excede 255 caracteres", async () => {
    const longDesc = "a".repeat(256);
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: longDesc, valor: "100,00", data: "2024-06-15" }));
    expect(result.fieldErrors?.descricao).toBe("Máximo de 255 caracteres.");
  });

  it("retorna fieldErrors quando observações excede 1000 caracteres", async () => {
    const longObs = "a".repeat(1001);
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Teste", valor: "100,00", data: "2024-06-15", observacoes: longObs }));
    expect(result.fieldErrors?.observacoes).toBe("Máximo de 1000 caracteres.");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Consulta", valor: "100,00", data: "2024-06-15" }));
    expect(result.error).toBe("Erro ao criar transação. Tente novamente.");
  });
});

describe("atualizarTransacao", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna fieldErrors quando tipo está vazio", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "t-1", descricao: "Teste", valor: "100,00", data: "2024-06-15" }));
    expect(result.fieldErrors?.tipo).toBe("Selecione o tipo.");
  });

  it("retorna fieldErrors quando descrição está vazia", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "t-1", tipo: "receita", descricao: "", valor: "100,00", data: "2024-06-15" }));
    expect(result.fieldErrors?.descricao).toBe("Descrição é obrigatória.");
  });

  it("retorna fieldErrors quando valor é inválido", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "t-1", tipo: "receita", descricao: "Teste", valor: "0", data: "2024-06-15" }));
    expect(result.fieldErrors?.valor).toBe("Informe um valor válido.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "t-1", tipo: "receita", descricao: "Teste", valor: "100,00", data: "" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarTransacao({}, makeFormData({ id: "t-1", tipo: "receita", descricao: "Consulta", valor: "350,00", data: "2024-06-15" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdateEq).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "receita",
        descricao: "Consulta",
        valor: 350,
      }),
      "t-1"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/financeiro/t-1?success=Transa%C3%A7%C3%A3o+atualizada");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarTransacao({}, makeFormData({ id: "t-1", tipo: "receita", descricao: "Consulta", valor: "100,00", data: "2024-06-15" }));
    expect(result.error).toBe("Erro ao atualizar transação. Tente novamente.");
  });
});

describe("excluirTransacao", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirTransacao("t-1")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("t-1");
    expect(mockRedirect).toHaveBeenCalledWith("/financeiro?success=Transa%C3%A7%C3%A3o+exclu%C3%ADda");
  });

  it("lança erro quando exclusão falha", async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirTransacao("t-1")).rejects.toThrow("Erro ao excluir transação.");
  });
});
