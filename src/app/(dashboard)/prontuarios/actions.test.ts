import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000003" }, error: null });
const mockUpdate = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockPacienteCheck = vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000001" }, error: null });
const mockRedirect = vi.fn();

vi.mock("@/lib/clinica", () => ({
  getMedicoId: vi.fn().mockResolvedValue("user-1"),
  getMedicoIdSafe: vi.fn().mockResolvedValue("user-1"),
}));

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
          insert: (data: unknown) => ({
            select: () => ({
              single: () => mockInsert(data),
            }),
          }),
          update: (data: unknown) => ({
            eq: (_col: string, val: string) => ({
              eq: () => mockUpdate({ data, id: val }),
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

vi.mock("./types", async () => {
  const actual = await vi.importActual("./types");
  return { ...actual };
});

import { criarProntuario, atualizarProntuario, excluirProntuario } from "./actions";
import { getMedicoIdSafe } from "@/lib/clinica";

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
    const result = await criarProntuario({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await criarProntuario({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2099-01-01", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("retorna fieldErrors quando evolução está vazia", async () => {
    const result = await criarProntuario({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15" }));
    expect(result.fieldErrors?.queixa_principal).toBe("Evolução é obrigatória.");
  });

  it("retorna fieldErrors quando queixa_principal excede limite", async () => {
    const result = await criarProntuario({}, makeFormData({
      paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15",
      queixa_principal: "A".repeat(5001),
    }));
    expect(result.fieldErrors?.queixa_principal).toBe("Máximo de 5000 caracteres.");
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarProntuario({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor de cabeça" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      paciente_id: "00000000-0000-0000-0000-000000000001",
      queixa_principal: "Dor de cabeça",
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/prontuarios/00000000-0000-0000-0000-000000000003?success=Prontu%C3%A1rio+registrado");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
    const result = await criarProntuario({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.error).toBe("Erro ao criar prontuário. Tente novamente.");
  });

  it("retorna fieldError quando paciente não pertence ao médico", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null, error: null });
    const result = await criarProntuario({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente não encontrado.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna erro quando getMedicoIdSafe retorna null", async () => {
    vi.mocked(getMedicoIdSafe).mockResolvedValueOnce(null);
    const result = await criarProntuario({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.error).toBe("Não foi possível identificar o médico responsável.");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("atualizarProntuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro quando ID é inválido", async () => {
    const result = await atualizarProntuario({}, makeFormData({ id: "invalido", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.error).toBe("ID inválido.");
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando data está vazia", async () => {
    const result = await atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.data).toBe("Data é obrigatória.");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2099-01-01", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("retorna fieldErrors quando evolução está vazia", async () => {
    const result = await atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15" }));
    expect(result.fieldErrors?.queixa_principal).toBe("Evolução é obrigatória.");
  });

  it("inclui updated_at ao atualizar", async () => {
    await expect(
      atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ updated_at: expect.any(String) }),
    }));
  });

  it("não nullifica campos SOAP ao atualizar", async () => {
    await expect(
      atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }))
    ).rejects.toThrow("REDIRECT");
    const payload = mockUpdate.mock.calls[0][0].data;
    expect(payload).not.toHaveProperty("cid");
    expect(payload).not.toHaveProperty("observacoes");
    expect(payload).not.toHaveProperty("historia_doenca");
    expect(payload).not.toHaveProperty("exame_fisico");
    expect(payload).not.toHaveProperty("hipotese_diagnostica");
    expect(payload).not.toHaveProperty("conduta");
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor de cabeça" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: "00000000-0000-0000-0000-000000000002",
      data: expect.objectContaining({
        paciente_id: "00000000-0000-0000-0000-000000000001",
        queixa_principal: "Dor de cabeça",
      }),
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/prontuarios/00000000-0000-0000-0000-000000000002?success=Prontu%C3%A1rio+atualizado");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.error).toBe("Erro ao atualizar prontuário. Tente novamente.");
  });

  it("retorna fieldError quando paciente não pertence ao médico", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null, error: null });
    const result = await atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente não encontrado.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna erro quando getMedicoIdSafe retorna null", async () => {
    vi.mocked(getMedicoIdSafe).mockResolvedValueOnce(null);
    const result = await atualizarProntuario({}, makeFormData({ id: "00000000-0000-0000-0000-000000000002", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", queixa_principal: "Dor" }));
    expect(result.error).toBe("Não foi possível identificar o médico responsável.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("excluirProntuario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lança erro quando ID é inválido", async () => {
    await expect(excluirProntuario("invalido")).rejects.toThrow("ID inválido.");
  });

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirProntuario("00000000-0000-0000-0000-000000000002")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000002");
    expect(mockRedirect).toHaveBeenCalledWith("/prontuarios?success=Prontu%C3%A1rio+exclu%C3%ADdo");
  });

  it("lança erro quando exclusão falha", async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirProntuario("00000000-0000-0000-0000-000000000002")).rejects.toThrow("Erro ao excluir prontuário.");
  });
});
