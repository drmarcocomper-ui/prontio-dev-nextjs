import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ data: { id: "rec-new" }, error: null });
const mockUpdate = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockRedirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (data: unknown) => ({
          select: () => ({
            single: () => mockInsert(data),
          }),
        }),
        update: (data: unknown) => ({
          eq: (_col: string, val: string) => mockUpdate({ data, id: val }),
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

vi.mock("./types", async () => {
  const actual = await vi.importActual("./types");
  return { ...actual };
});

import { criarReceita, atualizarReceita, excluirReceita } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("criarReceita", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await criarReceita({}, makeFormData({ data: "2024-06-15", tipo: "simples", medicamentos: "Amoxicilina" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await criarReceita({}, makeFormData({ paciente_id: "p-1", data: "", tipo: "simples", medicamentos: "Amoxicilina" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await criarReceita({}, makeFormData({ paciente_id: "p-1", data: "2099-01-01", tipo: "simples", medicamentos: "Amoxicilina" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("retorna fieldErrors quando tipo está vazio", async () => {
    const result = await criarReceita({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15", tipo: "", medicamentos: "Amoxicilina" }));
    expect(result.fieldErrors?.tipo).toBe("Selecione o tipo da receita.");
  });

  it("retorna fieldErrors quando medicamentos está vazio", async () => {
    const result = await criarReceita({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15", tipo: "simples", medicamentos: "" }));
    expect(result.fieldErrors?.medicamentos).toBe("Medicamentos é obrigatório.");
  });

  it("retorna fieldErrors quando medicamentos excede limite", async () => {
    const result = await criarReceita({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15", tipo: "simples", medicamentos: "A".repeat(5001) }));
    expect(result.fieldErrors?.medicamentos).toBe("Máximo de 5000 caracteres.");
  });

  it("retorna fieldErrors quando observacoes excede limite", async () => {
    const result = await criarReceita({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15", tipo: "simples", medicamentos: "Amoxicilina", observacoes: "A".repeat(1001) }));
    expect(result.fieldErrors?.observacoes).toBe("Máximo de 1000 caracteres.");
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarReceita({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15", tipo: "simples", medicamentos: "Amoxicilina 500mg" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      paciente_id: "p-1",
      medicamentos: "Amoxicilina 500mg",
      tipo: "simples",
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/receitas/rec-new?success=Receita+registrada");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
    const result = await criarReceita({}, makeFormData({ paciente_id: "p-1", data: "2024-06-15", tipo: "simples", medicamentos: "Amoxicilina" }));
    expect(result.error).toBe("Erro ao criar receita. Tente novamente.");
  });
});

describe("atualizarReceita", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await atualizarReceita({}, makeFormData({ id: "rec-1", data: "2024-06-15", tipo: "simples", medicamentos: "Amoxicilina" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await atualizarReceita({}, makeFormData({ id: "rec-1", paciente_id: "p-1", data: "", tipo: "simples", medicamentos: "Amoxicilina" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await atualizarReceita({}, makeFormData({ id: "rec-1", paciente_id: "p-1", data: "2099-01-01", tipo: "simples", medicamentos: "Amoxicilina" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("retorna fieldErrors quando tipo está vazio", async () => {
    const result = await atualizarReceita({}, makeFormData({ id: "rec-1", paciente_id: "p-1", data: "2024-06-15", tipo: "", medicamentos: "Amoxicilina" }));
    expect(result.fieldErrors?.tipo).toBe("Selecione o tipo da receita.");
  });

  it("retorna fieldErrors quando medicamentos está vazio", async () => {
    const result = await atualizarReceita({}, makeFormData({ id: "rec-1", paciente_id: "p-1", data: "2024-06-15", tipo: "simples", medicamentos: "" }));
    expect(result.fieldErrors?.medicamentos).toBe("Medicamentos é obrigatório.");
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarReceita({}, makeFormData({ id: "rec-1", paciente_id: "p-1", data: "2024-06-15", tipo: "especial", medicamentos: "Ritalina 10mg" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: "rec-1",
      data: expect.objectContaining({
        paciente_id: "p-1",
        medicamentos: "Ritalina 10mg",
      }),
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/receitas/rec-1?success=Receita+atualizada");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarReceita({}, makeFormData({ id: "rec-1", paciente_id: "p-1", data: "2024-06-15", tipo: "simples", medicamentos: "Amoxicilina" }));
    expect(result.error).toBe("Erro ao atualizar receita. Tente novamente.");
  });
});

describe("excluirReceita", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirReceita("rec-1")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("rec-1");
    expect(mockRedirect).toHaveBeenCalledWith("/receitas?success=Receita+exclu%C3%ADda");
  });

  it("lança erro quando exclusão falha", async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirReceita("rec-1")).rejects.toThrow("Erro ao excluir receita.");
  });
});
