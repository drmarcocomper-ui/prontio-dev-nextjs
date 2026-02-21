import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000005" }, error: null });
const mockUpdate = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockSelectPacienteId = vi.fn().mockResolvedValue({ data: { paciente_id: "00000000-0000-0000-0000-000000000001" } });
const mockPacienteCheck = vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000001" }, error: null });
const mockRedirect = vi.fn();
const mockRateLimit = vi.fn().mockResolvedValue({ success: true });
const mockGetClinicaAtual = vi.fn().mockResolvedValue({
  clinicaId: "clinic-1",
  clinicaNome: "Clínica Teste",
  papel: "profissional_saude",
  userId: "user-1",
});

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock("@/lib/clinica", () => ({
  getMedicoId: vi.fn().mockResolvedValue("user-1"),
  getMedicoIdSafe: vi.fn().mockResolvedValue("user-1"),
  getClinicaAtual: (...args: unknown[]) => mockGetClinicaAtual(...args),
  isProfissional: (p: string) => ["superadmin", "profissional_saude"].includes(p),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "pacientes") {
          return {
            select: () => ({
              eq: () => ({
                single: () => mockPacienteCheck(),
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

import { criarAtestado, atualizarAtestado, excluirAtestado } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const validData = {
  paciente_id: "00000000-0000-0000-0000-000000000001",
  data: "2024-06-15",
  tipo: "afastamento",
  conteudo: "Paciente necessita de afastamento por 3 dias.",
};

describe("criarAtestado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetClinicaAtual.mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "user-1" });
  });

  it("retorna erro quando secretaria tenta criar atestado", async () => {
    mockGetClinicaAtual.mockResolvedValueOnce({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "secretaria", userId: "user-1" });
    const result = await criarAtestado({}, makeFormData(validData));
    expect(result.error).toBe("Apenas profissionais de saúde podem emitir atestados.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await criarAtestado({}, makeFormData(validData));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, paciente_id: "" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando paciente_id é inválido", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, paciente_id: "invalido" }));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente inválido.");
  });

  it("retorna fieldErrors quando tipo está vazio", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, tipo: "" }));
    expect(result.fieldErrors?.tipo).toBe("Selecione o tipo de atestado.");
  });

  it("retorna fieldErrors quando tipo é inválido", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, tipo: "invalido" }));
    expect(result.fieldErrors?.tipo).toBe("Tipo de atestado inválido.");
  });

  it("retorna fieldErrors quando conteudo está vazio", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, conteudo: "" }));
    expect(result.fieldErrors?.conteudo).toBe("Conteúdo é obrigatório.");
  });

  it("retorna fieldErrors quando conteudo excede limite", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, conteudo: "A".repeat(5001) }));
    expect(result.fieldErrors?.conteudo).toBe("Máximo de 5000 caracteres.");
  });

  it("retorna fieldErrors quando cid excede limite", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, cid: "A".repeat(21) }));
    expect(result.fieldErrors?.cid).toBe("Máximo de 20 caracteres.");
  });

  it("retorna fieldErrors quando observacoes excede limite", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, observacoes: "A".repeat(1001) }));
    expect(result.fieldErrors?.observacoes).toBe("Máximo de 1000 caracteres.");
  });

  it("retorna fieldErrors quando dias_afastamento é inválido", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, dias_afastamento: "-1" }));
    expect(result.fieldErrors?.dias_afastamento).toBe("Informe um número inteiro positivo.");
  });

  it("retorna fieldErrors quando dias_afastamento não é número", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, dias_afastamento: "abc" }));
    expect(result.fieldErrors?.dias_afastamento).toBe("Informe um número inteiro positivo.");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await criarAtestado({}, makeFormData({ ...validData, data: "2099-01-01" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("aceita data vazia (campo opcional)", async () => {
    await expect(
      criarAtestado({}, makeFormData({ ...validData, data: "" }))
    ).rejects.toThrow("REDIRECT");
  });

  it("retorna fieldError quando paciente não pertence ao médico", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null, error: null });
    const result = await criarAtestado({}, makeFormData(validData));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente não encontrado.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarAtestado({}, makeFormData(validData))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      paciente_id: "00000000-0000-0000-0000-000000000001",
      tipo: "afastamento",
      conteudo: "Paciente necessita de afastamento por 3 dias.",
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes/00000000-0000-0000-0000-000000000001?tab=prontuario&success=Atestado+registrado");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
    const result = await criarAtestado({}, makeFormData(validData));
    expect(result.error).toBe("Erro ao criar atestado. Tente novamente.");
  });

  it("aceita dias_afastamento válido", async () => {
    await expect(
      criarAtestado({}, makeFormData({ ...validData, dias_afastamento: "3" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      dias_afastamento: 3,
    }));
  });
});

describe("atualizarAtestado", () => {
  const validUpdateData = { id: "00000000-0000-0000-0000-000000000004", ...validData };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetClinicaAtual.mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "user-1" });
  });

  it("retorna erro quando secretaria tenta editar atestado", async () => {
    mockGetClinicaAtual.mockResolvedValueOnce({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "secretaria", userId: "user-1" });
    const result = await atualizarAtestado({}, makeFormData(validUpdateData));
    expect(result.error).toBe("Apenas profissionais de saúde podem editar atestados.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await atualizarAtestado({}, makeFormData(validUpdateData));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna erro quando ID é inválido", async () => {
    const result = await atualizarAtestado({}, makeFormData({ ...validUpdateData, id: "invalido" }));
    expect(result.error).toBe("ID inválido.");
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await atualizarAtestado({}, makeFormData({ ...validUpdateData, paciente_id: "" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando conteudo está vazio", async () => {
    const result = await atualizarAtestado({}, makeFormData({ ...validUpdateData, conteudo: "" }));
    expect(result.fieldErrors?.conteudo).toBe("Conteúdo é obrigatório.");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await atualizarAtestado({}, makeFormData({ ...validUpdateData, data: "2099-01-01" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarAtestado({}, makeFormData(validUpdateData))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: "00000000-0000-0000-0000-000000000004",
      data: expect.objectContaining({
        paciente_id: "00000000-0000-0000-0000-000000000001",
        tipo: "afastamento",
      }),
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/atestados/00000000-0000-0000-0000-000000000004?success=Atestado+atualizado");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarAtestado({}, makeFormData(validUpdateData));
    expect(result.error).toBe("Erro ao atualizar atestado. Tente novamente.");
  });

  it("retorna fieldError quando paciente não pertence ao médico", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null, error: null });
    const result = await atualizarAtestado({}, makeFormData(validUpdateData));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente não encontrado.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("excluirAtestado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetClinicaAtual.mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "user-1" });
  });

  it("lança erro quando secretaria tenta excluir atestado", async () => {
    mockGetClinicaAtual.mockResolvedValueOnce({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "secretaria", userId: "user-1" });
    await expect(excluirAtestado("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Apenas profissionais de saúde podem excluir atestados.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando getMedicoIdSafe retorna null", async () => {
    const { getMedicoIdSafe } = await import("@/lib/clinica");
    vi.mocked(getMedicoIdSafe).mockResolvedValueOnce(null as unknown as string);
    await expect(excluirAtestado("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Não foi possível identificar o médico responsável.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    await expect(excluirAtestado("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando ID é inválido", async () => {
    await expect(excluirAtestado("invalido")).rejects.toThrow("ID inválido.");
  });

  it("redireciona para paciente após exclusão com sucesso", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: { paciente_id: "00000000-0000-0000-0000-000000000001" } });
    await expect(excluirAtestado("00000000-0000-0000-0000-000000000004")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000004");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes/00000000-0000-0000-0000-000000000001?tab=prontuario&success=Atestado+exclu%C3%ADdo");
  });

  it("redireciona para pacientes quando paciente_id não encontrado", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: null });
    await expect(excluirAtestado("00000000-0000-0000-0000-000000000004")).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });

  it("lança erro quando exclusão falha", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: { paciente_id: "00000000-0000-0000-0000-000000000001" } });
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirAtestado("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Erro ao excluir atestado.");
  });
});
