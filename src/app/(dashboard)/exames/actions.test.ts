import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000005" }, error: null });
const mockUpdate = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockSelectPacienteId = vi.fn().mockResolvedValue({ data: { paciente_id: "00000000-0000-0000-0000-000000000001" } });
const mockPacienteCheck = vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000001" }, error: null });
const mockRedirect = vi.fn();
const mockRateLimit = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

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
          select: () => ({
            eq: (_col: string, val: string) => ({
              eq: () => ({
                single: () => mockSelectPacienteId(val),
              }),
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

import { criarExame, atualizarExame, excluirExame } from "./actions";
import { getMedicoIdSafe } from "@/lib/clinica";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("criarExame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await criarExame({}, makeFormData({ data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("aceita data vazia (campo opcional)", async () => {
    await expect(
      criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "", exames: "Hemograma completo" }))
    ).rejects.toThrow("REDIRECT");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2099-01-01", exames: "Hemograma completo" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("retorna fieldErrors quando exames está vazio", async () => {
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "" }));
    expect(result.fieldErrors?.exames).toBe("Exames é obrigatório.");
  });

  it("retorna fieldErrors quando exames excede limite", async () => {
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "A".repeat(5001) }));
    expect(result.fieldErrors?.exames).toBe("Máximo de 5000 caracteres.");
  });

  it("retorna fieldErrors quando indicacao_clinica excede limite", async () => {
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo", indicacao_clinica: "A".repeat(2001) }));
    expect(result.fieldErrors?.indicacao_clinica).toBe("Máximo de 2000 caracteres.");
  });

  it("retorna fieldErrors quando observacoes excede limite", async () => {
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo", observacoes: "A".repeat(1001) }));
    expect(result.fieldErrors?.observacoes).toBe("Máximo de 1000 caracteres.");
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      paciente_id: "00000000-0000-0000-0000-000000000001",
      exames: "Hemograma completo",
      medico_id: "user-1",
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes/00000000-0000-0000-0000-000000000001?tab=prontuario&success=Solicitação+registrada");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.error).toContain("Erro ao criar solicitação de exame");
  });

  it("retorna fieldError quando paciente não pertence ao médico", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null, error: null });
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente não encontrado.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna erro quando getMedicoIdSafe retorna null", async () => {
    vi.mocked(getMedicoIdSafe).mockResolvedValueOnce(null);
    const result = await criarExame({}, makeFormData({ paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.error).toBe("Não foi possível identificar o médico responsável.");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("atualizarExame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna erro quando ID é inválido", async () => {
    const result = await atualizarExame({}, makeFormData({ id: "invalido", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.error).toBe("ID inválido.");
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("aceita data vazia (campo opcional)", async () => {
    await expect(
      atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "", exames: "Hemograma completo" }))
    ).rejects.toThrow("REDIRECT");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2099-01-01", exames: "Hemograma completo" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("retorna fieldErrors quando exames está vazio", async () => {
    const result = await atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "" }));
    expect(result.fieldErrors?.exames).toBe("Exames é obrigatório.");
  });

  it("inclui updated_at ao atualizar", async () => {
    await expect(
      atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ updated_at: expect.any(String) }),
    }));
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Glicemia de jejum" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: "00000000-0000-0000-0000-000000000004",
      data: expect.objectContaining({
        paciente_id: "00000000-0000-0000-0000-000000000001",
        exames: "Glicemia de jejum",
      }),
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/exames/00000000-0000-0000-0000-000000000004?success=Solicitação+atualizada");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.error).toContain("Erro ao atualizar solicitação de exame");
  });

  it("retorna fieldError quando paciente não pertence ao médico", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null, error: null });
    const result = await atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente não encontrado.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna erro quando getMedicoIdSafe retorna null", async () => {
    vi.mocked(getMedicoIdSafe).mockResolvedValueOnce(null);
    const result = await atualizarExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000004", paciente_id: "00000000-0000-0000-0000-000000000001", data: "2024-06-15", exames: "Hemograma completo" }));
    expect(result.error).toBe("Não foi possível identificar o médico responsável.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("excluirExame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lança erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    await expect(excluirExame("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando ID é inválido", async () => {
    await expect(excluirExame("invalido")).rejects.toThrow("ID inválido.");
  });

  it("redireciona para paciente após exclusão com sucesso", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: { paciente_id: "00000000-0000-0000-0000-000000000001" } });
    await expect(excluirExame("00000000-0000-0000-0000-000000000004")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000004");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes/00000000-0000-0000-0000-000000000001?tab=prontuario&success=Solicitação+exclu%C3%ADda");
  });

  it("redireciona para /pacientes quando paciente_id não encontrado", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: null });
    await expect(excluirExame("00000000-0000-0000-0000-000000000004")).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });

  it("lança erro quando exclusão falha", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: { paciente_id: "00000000-0000-0000-0000-000000000001" } });
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirExame("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Erro ao excluir solicitação de exame");
  });
});
