import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockRedirect = vi.fn();
const mockRateLimit = vi.fn().mockResolvedValue({ success: true });

const mockMedicoId = vi.fn().mockResolvedValue("user-1");

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "profissional_saude",
    userId: "user-1",
  }),
  getMedicoId: (...args: unknown[]) => mockMedicoId(...args),
  getMedicoIdSafe: async () => { try { return await mockMedicoId(); } catch { return null; } },
}));

const mockPacienteCheck = vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000001" } });

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "pacientes") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => mockPacienteCheck(),
                }),
              }),
            }),
          };
        }
        return {
          insert: (data: unknown) => {
            mockInsert(data);
            return mockInsert.mock.results[mockInsert.mock.results.length - 1].value;
          },
          update: (data: unknown) => ({
            eq: (_col: string, val: string) => ({
              eq: () => mockUpdateEq(data, val),
            }),
          }),
          delete: () => ({
            eq: (_col: string, val: string) => ({
              eq: () => mockDelete(val),
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

import { criarTransacao, atualizarTransacao, excluirTransacao } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("criarTransacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Consulta", valor: "100,00", data: "2024-06-15" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

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

  it("retorna fieldErrors quando valor excede limite", async () => {
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Teste", valor: "1.000.000,00", data: "2024-06-15" }));
    expect(result.fieldErrors?.valor).toBe("Valor máximo é R$ 999.999,99.");
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

  it("retorna fieldErrors quando paciente_id é UUID inválido", async () => {
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Consulta", valor: "100,00", data: "2024-06-15", paciente_id: "invalido" }));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente inválido.");
  });

  it("retorna fieldErrors quando paciente não pertence ao médico", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null });
    await expect(
      criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Consulta", valor: "100,00", data: "2024-06-15", paciente_id: "00000000-0000-0000-0000-000000000001" }))
    ).resolves.toEqual({ fieldErrors: { paciente_id: "Paciente não encontrado." } });
  });

  it("retorna erro quando getMedicoId lança exceção (com paciente_id)", async () => {
    mockMedicoId.mockRejectedValueOnce(new Error("Sem contexto"));
    const result = await criarTransacao({}, makeFormData({ tipo: "receita", descricao: "Consulta", valor: "100,00", data: "2024-06-15", paciente_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("Não foi possível identificar o médico responsável.");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("atualizarTransacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await atualizarTransacao({}, makeFormData({ id: "00000000-0000-0000-0000-000000000006", tipo: "receita", descricao: "Consulta", valor: "100,00", data: "2024-06-15" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("retorna erro quando ID é inválido", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "invalido", tipo: "receita", descricao: "Teste", valor: "100,00", data: "2024-06-15" }));
    expect(result.error).toBe("ID inválido.");
  });

  it("retorna fieldErrors quando tipo está vazio", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "00000000-0000-0000-0000-000000000006", descricao: "Teste", valor: "100,00", data: "2024-06-15" }));
    expect(result.fieldErrors?.tipo).toBe("Selecione o tipo.");
  });

  it("retorna fieldErrors quando descrição está vazia", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "00000000-0000-0000-0000-000000000006", tipo: "receita", descricao: "", valor: "100,00", data: "2024-06-15" }));
    expect(result.fieldErrors?.descricao).toBe("Descrição é obrigatória.");
  });

  it("retorna fieldErrors quando valor é inválido", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "00000000-0000-0000-0000-000000000006", tipo: "receita", descricao: "Teste", valor: "0", data: "2024-06-15" }));
    expect(result.fieldErrors?.valor).toBe("Informe um valor válido.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await atualizarTransacao({}, makeFormData({ id: "00000000-0000-0000-0000-000000000006", tipo: "receita", descricao: "Teste", valor: "100,00", data: "" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarTransacao({}, makeFormData({ id: "00000000-0000-0000-0000-000000000006", tipo: "receita", descricao: "Consulta", valor: "350,00", data: "2024-06-15" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdateEq).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "receita",
        descricao: "Consulta",
        valor: 350,
      }),
      "00000000-0000-0000-0000-000000000006"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/financeiro/00000000-0000-0000-0000-000000000006?success=Transa%C3%A7%C3%A3o+atualizada");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarTransacao({}, makeFormData({ id: "00000000-0000-0000-0000-000000000006", tipo: "receita", descricao: "Consulta", valor: "100,00", data: "2024-06-15" }));
    expect(result.error).toBe("Erro ao atualizar transação. Tente novamente.");
  });
});

describe("excluirTransacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lança erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    await expect(excluirTransacao("00000000-0000-0000-0000-000000000006")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando ID é inválido", async () => {
    await expect(excluirTransacao("invalido")).rejects.toThrow("ID inválido.");
  });

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirTransacao("00000000-0000-0000-0000-000000000006")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000006");
    expect(mockRedirect).toHaveBeenCalledWith("/financeiro?success=Transa%C3%A7%C3%A3o+exclu%C3%ADda");
  });

  it("lança erro quando exclusão falha", async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirTransacao("00000000-0000-0000-0000-000000000006")).rejects.toThrow("Erro ao excluir transação.");
  });
});
