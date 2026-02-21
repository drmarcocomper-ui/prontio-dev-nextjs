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

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("./types", async () => {
  const actual = await vi.importActual("./types");
  return { ...actual };
});

import { criarEncaminhamento, atualizarEncaminhamento, excluirEncaminhamento } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const validData = {
  paciente_id: "00000000-0000-0000-0000-000000000001",
  data: "2024-06-15",
  profissional_destino: "Dr. João Cardiologista",
  especialidade: "Cardiologia",
  motivo: "Paciente apresenta sopro cardíaco, necessita avaliação especializada.",
};

describe("criarEncaminhamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetClinicaAtual.mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "user-1" });
  });

  it("retorna erro quando secretaria tenta criar encaminhamento", async () => {
    mockGetClinicaAtual.mockResolvedValueOnce({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "secretaria", userId: "user-1" });
    const result = await criarEncaminhamento({}, makeFormData(validData));
    expect(result.error).toBe("Apenas profissionais de saúde podem criar encaminhamentos.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await criarEncaminhamento({}, makeFormData(validData));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, paciente_id: "" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando paciente_id é inválido", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, paciente_id: "invalido" }));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente inválido.");
  });

  it("retorna fieldErrors quando profissional_destino está vazio", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, profissional_destino: "" }));
    expect(result.fieldErrors?.profissional_destino).toBe("Informe o profissional de destino.");
  });

  it("retorna fieldErrors quando profissional_destino excede limite", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, profissional_destino: "A".repeat(201) }));
    expect(result.fieldErrors?.profissional_destino).toBe("Máximo de 200 caracteres.");
  });

  it("retorna fieldErrors quando especialidade está vazia", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, especialidade: "" }));
    expect(result.fieldErrors?.especialidade).toBe("Informe a especialidade.");
  });

  it("retorna fieldErrors quando especialidade excede limite", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, especialidade: "A".repeat(201) }));
    expect(result.fieldErrors?.especialidade).toBe("Máximo de 200 caracteres.");
  });

  it("retorna fieldErrors quando motivo está vazio", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, motivo: "" }));
    expect(result.fieldErrors?.motivo).toBe("Informe o motivo do encaminhamento.");
  });

  it("retorna fieldErrors quando motivo excede limite", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, motivo: "A".repeat(5001) }));
    expect(result.fieldErrors?.motivo).toBe("Máximo de 5000 caracteres.");
  });

  it("retorna fieldErrors quando telefone_profissional excede limite", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, telefone_profissional: "A".repeat(21) }));
    expect(result.fieldErrors?.telefone_profissional).toBe("Máximo de 20 caracteres.");
  });

  it("retorna fieldErrors quando observacoes excede limite", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, observacoes: "A".repeat(1001) }));
    expect(result.fieldErrors?.observacoes).toBe("Máximo de 1000 caracteres.");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await criarEncaminhamento({}, makeFormData({ ...validData, data: "2099-01-01" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("aceita data vazia (campo opcional)", async () => {
    await expect(
      criarEncaminhamento({}, makeFormData({ ...validData, data: "" }))
    ).rejects.toThrow("REDIRECT");
  });

  it("retorna fieldError quando paciente não encontrado", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null, error: null });
    const result = await criarEncaminhamento({}, makeFormData(validData));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente não encontrado.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("redireciona após criação com sucesso", async () => {
    await expect(
      criarEncaminhamento({}, makeFormData(validData))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      paciente_id: "00000000-0000-0000-0000-000000000001",
      profissional_destino: "Dr. João Cardiologista",
      especialidade: "Cardiologia",
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/encaminhamentos/00000000-0000-0000-0000-000000000005?success=Encaminhamento+registrado");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
    const result = await criarEncaminhamento({}, makeFormData(validData));
    expect(result.error).toBe("Erro ao criar encaminhamento. Tente novamente.");
  });
});

describe("atualizarEncaminhamento", () => {
  const validUpdateData = { id: "00000000-0000-0000-0000-000000000004", ...validData };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetClinicaAtual.mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "user-1" });
  });

  it("retorna erro quando secretaria tenta editar encaminhamento", async () => {
    mockGetClinicaAtual.mockResolvedValueOnce({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "secretaria", userId: "user-1" });
    const result = await atualizarEncaminhamento({}, makeFormData(validUpdateData));
    expect(result.error).toBe("Apenas profissionais de saúde podem editar encaminhamentos.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await atualizarEncaminhamento({}, makeFormData(validUpdateData));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna erro quando ID é inválido", async () => {
    const result = await atualizarEncaminhamento({}, makeFormData({ ...validUpdateData, id: "invalido" }));
    expect(result.error).toBe("ID inválido.");
  });

  it("retorna fieldErrors quando paciente não selecionado", async () => {
    const result = await atualizarEncaminhamento({}, makeFormData({ ...validUpdateData, paciente_id: "" }));
    expect(result.fieldErrors?.paciente_id).toBe("Selecione um paciente.");
  });

  it("retorna fieldErrors quando profissional_destino está vazio", async () => {
    const result = await atualizarEncaminhamento({}, makeFormData({ ...validUpdateData, profissional_destino: "" }));
    expect(result.fieldErrors?.profissional_destino).toBe("Informe o profissional de destino.");
  });

  it("retorna fieldErrors quando especialidade está vazia", async () => {
    const result = await atualizarEncaminhamento({}, makeFormData({ ...validUpdateData, especialidade: "" }));
    expect(result.fieldErrors?.especialidade).toBe("Informe a especialidade.");
  });

  it("retorna fieldErrors quando motivo está vazio", async () => {
    const result = await atualizarEncaminhamento({}, makeFormData({ ...validUpdateData, motivo: "" }));
    expect(result.fieldErrors?.motivo).toBe("Informe o motivo do encaminhamento.");
  });

  it("retorna fieldErrors quando data é no futuro", async () => {
    const result = await atualizarEncaminhamento({}, makeFormData({ ...validUpdateData, data: "2099-01-01" }));
    expect(result.fieldErrors?.data).toBe("A data não pode ser no futuro.");
  });

  it("aceita data vazia (campo opcional)", async () => {
    await expect(
      atualizarEncaminhamento({}, makeFormData({ ...validUpdateData, data: "" }))
    ).rejects.toThrow("REDIRECT");
  });

  it("retorna fieldError quando paciente não encontrado", async () => {
    mockPacienteCheck.mockResolvedValueOnce({ data: null, error: null });
    const result = await atualizarEncaminhamento({}, makeFormData(validUpdateData));
    expect(result.fieldErrors?.paciente_id).toBe("Paciente não encontrado.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarEncaminhamento({}, makeFormData(validUpdateData))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: "00000000-0000-0000-0000-000000000004",
      data: expect.objectContaining({
        paciente_id: "00000000-0000-0000-0000-000000000001",
        profissional_destino: "Dr. João Cardiologista",
      }),
    }));
    expect(mockRedirect).toHaveBeenCalledWith("/encaminhamentos/00000000-0000-0000-0000-000000000004?success=Encaminhamento+atualizado");
  });

  it("retorna erro quando supabase falha", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarEncaminhamento({}, makeFormData(validUpdateData));
    expect(result.error).toBe("Erro ao atualizar encaminhamento. Tente novamente.");
  });
});

describe("excluirEncaminhamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetClinicaAtual.mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "user-1" });
  });

  it("lança erro quando secretaria tenta excluir encaminhamento", async () => {
    mockGetClinicaAtual.mockResolvedValueOnce({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "secretaria", userId: "user-1" });
    await expect(excluirEncaminhamento("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Apenas profissionais de saúde podem excluir encaminhamentos.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando getMedicoIdSafe retorna null", async () => {
    const { getMedicoIdSafe } = await import("@/lib/clinica");
    vi.mocked(getMedicoIdSafe).mockResolvedValueOnce(null as unknown as string);
    await expect(excluirEncaminhamento("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Não foi possível identificar o médico responsável.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    await expect(excluirEncaminhamento("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando ID é inválido", async () => {
    await expect(excluirEncaminhamento("invalido")).rejects.toThrow("ID inválido.");
  });

  it("redireciona para paciente após exclusão com sucesso", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: { paciente_id: "00000000-0000-0000-0000-000000000001" } });
    await expect(excluirEncaminhamento("00000000-0000-0000-0000-000000000004")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000004");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes/00000000-0000-0000-0000-000000000001?tab=prontuario&success=Encaminhamento+exclu%C3%ADdo");
  });

  it("redireciona para pacientes quando paciente_id não encontrado", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: null });
    await expect(excluirEncaminhamento("00000000-0000-0000-0000-000000000004")).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });

  it("lança erro quando exclusão falha", async () => {
    mockSelectPacienteId.mockResolvedValueOnce({ data: { paciente_id: "00000000-0000-0000-0000-000000000001" } });
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirEncaminhamento("00000000-0000-0000-0000-000000000004")).rejects.toThrow("Erro ao excluir encaminhamento.");
  });
});
