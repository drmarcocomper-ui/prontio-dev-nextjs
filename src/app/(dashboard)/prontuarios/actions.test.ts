import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (data: unknown) => ({
          select: () => ({
            single: () => {
              mockInsert(data);
              return Promise.resolve({ data: { id: "pr-new" }, error: null });
            },
          }),
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

import { criarProntuario, excluirProntuario } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("criarProntuario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await criarProntuario({}, makeFormData({ data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await criarProntuario({}, makeFormData({ paciente_id: "p-1", data: "", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando queixa e conduta estão vazios", async () => {
    const result = await criarProntuario({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15" }));
    expect(result.fieldErrors?.queixa_principal).toBe("Preencha ao menos a queixa principal ou a conduta.");
  });

  it("aceita quando apenas conduta é preenchida", async () => {
    await expect(
      criarProntuario({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15", conduta: "Prescrição" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarProntuario({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15", queixa_principal: "Dor de cabeça" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      paciente_id: "p-1",
      queixa_principal: "Dor de cabeça",
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/prontuarios/pr-new?success=Prontu%C3%A1rio+registrado");
  });
});

describe("excluirProntuario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirProntuario("pr-1")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("pr-1");
    expect(mockRedirect).toHaveBeenCalledWith("/prontuarios?success=Prontu%C3%A1rio+exclu%C3%ADdo");
  });
});
