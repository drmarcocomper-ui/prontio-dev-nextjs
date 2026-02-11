import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
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

import { criarTransacao, excluirTransacao } from "./actions";

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
});

describe("excluirTransacao", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirTransacao("t-1")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("t-1");
    expect(mockRedirect).toHaveBeenCalledWith("/financeiro?success=Transa%C3%A7%C3%A3o+exclu%C3%ADda");
  });
});
