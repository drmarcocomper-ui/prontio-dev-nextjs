import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockUpdate = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockResolvedValue({ error: null });
const mockRedirect = vi.fn();

let insertResponse: { data: unknown; error: unknown };

const mockRateLimit = vi.fn().mockResolvedValue({ success: true });

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
  getMedicoId: vi.fn().mockResolvedValue("user-1"),
  getMedicoIdSafe: vi.fn().mockResolvedValue("user-1"),
  isAtendimento: (p: string) => p === "superadmin" || p === "gestor" || p === "profissional_saude" || p === "secretaria",
  isProfissional: (p: string) => p === "superadmin" || p === "profissional_saude",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (data: unknown) => {
          mockInsert(data);
          const getResponse = () => Promise.resolve(insertResponse);
          return {
            then: (resolve: (v: unknown) => unknown, reject?: (v: unknown) => unknown) =>
              getResponse().then(resolve, reject),
            select: () => ({
              single: getResponse,
            }),
          };
        },
        update: (data: unknown) => ({
          eq: () => mockUpdate(data),
        }),
        delete: () => ({
          eq: (_col: unknown, val: string) => mockDelete(val),
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

import { criarPaciente, atualizarPaciente, excluirPaciente, criarPacienteRapido } from "./actions";
import { getClinicaAtual } from "@/lib/clinica";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("criarPaciente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    insertResponse = { data: null, error: null };
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await criarPaciente({}, makeFormData({ nome: "João" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna fieldErrors quando nome está vazio", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "" }));
    expect(result.fieldErrors?.nome).toBe("Nome é obrigatório.");
  });

  it("retorna fieldErrors quando CPF é inválido", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "João", cpf: "123" }));
    expect(result.fieldErrors?.cpf).toBe("CPF inválido.");
  });

  it("retorna fieldErrors quando email é inválido", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "João", email: "invalido" }));
    expect(result.fieldErrors?.email).toBe("E-mail inválido.");
  });

  it("retorna fieldErrors quando telefone tem dígitos insuficientes", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "João", telefone: "123456" }));
    expect(result.fieldErrors?.telefone).toBe("Telefone deve ter 10 ou 11 dígitos.");
  });

  it("retorna fieldErrors quando CEP não tem 8 dígitos", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "João", cep: "1234" }));
    expect(result.fieldErrors?.cep).toBe("CEP deve ter 8 dígitos.");
  });

  it("retorna fieldErrors quando data de nascimento é no futuro", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "João", data_nascimento: "2099-01-01" }));
    expect(result.fieldErrors?.data_nascimento).toBe("A data de nascimento não pode ser no futuro.");
  });

  it("retorna fieldErrors quando observações excedem limite", async () => {
    const result = await criarPaciente({}, makeFormData({ nome: "João", observacoes: "A".repeat(1001) }));
    expect(result.fieldErrors?.observacoes).toBe("Máximo de 1000 caracteres.");
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
      criarPaciente({}, makeFormData({ nome: "João", cpf: "529.982.247-25", telefone: "(11) 98765-4321" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ cpf: "52998224725", telefone: "11987654321" })
    );
  });

  it("retorna erro de CPF duplicado quando código 23505", async () => {
    insertResponse = { data: null, error: { code: "23505" } };
    const result = await criarPaciente({}, makeFormData({ nome: "João" }));
    expect(result.error).toBe("Já existe um paciente com este CPF.");
  });

  it("retorna erro genérico quando insert falha", async () => {
    insertResponse = { data: null, error: { message: "DB error" } };
    const result = await criarPaciente({}, makeFormData({ nome: "João" }));
    expect(result.error).toBe("Erro ao criar paciente. Tente novamente.");
  });
});

describe("criarPacienteRapido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    insertResponse = { data: { id: "new-uuid" }, error: null };
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await criarPacienteRapido({ nome: "João" });
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna fieldErrors quando nome está vazio", async () => {
    const result = await criarPacienteRapido({ nome: "" });
    expect(result.fieldErrors?.nome).toBe("Nome é obrigatório.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna fieldErrors quando telefone tem dígitos insuficientes", async () => {
    const result = await criarPacienteRapido({ nome: "João", telefone: "123456" });
    expect(result.fieldErrors?.telefone).toBe("Telefone deve ter 10 ou 11 dígitos.");
  });

  it("retorna fieldErrors quando convênio é inválido", async () => {
    const result = await criarPacienteRapido({ nome: "João", convenio: "invalido" });
    expect(result.fieldErrors?.convenio).toBe("Valor inválido.");
  });

  it("retorna id e nome após criação com sucesso", async () => {
    const result = await criarPacienteRapido({ nome: "João Silva" });
    expect(result.id).toBe("new-uuid");
    expect(result.nome).toBe("João Silva");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "João Silva", medico_id: "user-1" })
    );
  });

  it("aceita telefone e convênio opcionais", async () => {
    const result = await criarPacienteRapido({
      nome: "Maria",
      telefone: "(11) 98765-4321",
      convenio: "particular",
    });
    expect(result.id).toBe("new-uuid");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Maria",
        telefone: "11987654321",
        convenio: "particular",
      })
    );
  });

  it("retorna erro genérico quando insert falha", async () => {
    insertResponse = { data: null, error: { message: "DB error" } };
    const result = await criarPacienteRapido({ nome: "João" });
    expect(result.error).toBe("Erro ao criar paciente. Tente novamente.");
  });

  it("não redireciona após criação", async () => {
    await criarPacienteRapido({ nome: "João" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe("atualizarPaciente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    insertResponse = { data: null, error: null };
  });

  it("retorna erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const result = await atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "Maria" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna erro quando ID é inválido", async () => {
    const result = await atualizarPaciente({}, makeFormData({ id: "invalido", nome: "Maria" }));
    expect(result.error).toBe("ID inválido.");
  });

  it("retorna fieldErrors quando nome está vazio", async () => {
    const result = await atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "" }));
    expect(result.fieldErrors?.nome).toBe("Nome é obrigatório.");
  });

  it("redireciona após atualização com sucesso", async () => {
    await expect(
      atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "Maria" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ nome: "Maria" }));
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes/00000000-0000-0000-0000-000000000001?success=Paciente+atualizado");
  });

  it("retorna erro de CPF duplicado quando código 23505", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { code: "23505" } });
    const result = await atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "Maria" }));
    expect(result.error).toBe("Já existe um paciente com este CPF.");
  });

  it("retorna erro genérico quando update falha", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "Maria" }));
    expect(result.error).toBe("Erro ao atualizar paciente. Tente novamente.");
  });

  it("retorna fieldErrors quando email é inválido na atualização", async () => {
    const result = await atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "Maria", email: "invalido" }));
    expect(result.fieldErrors?.email).toBe("E-mail inválido.");
  });

  it("retorna fieldErrors quando CPF é inválido na atualização", async () => {
    const result = await atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "Maria", cpf: "123" }));
    expect(result.fieldErrors?.cpf).toBe("CPF inválido.");
  });

  it("retorna fieldErrors quando telefone é inválido na atualização", async () => {
    const result = await atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "Maria", telefone: "123" }));
    expect(result.fieldErrors?.telefone).toBe("Telefone deve ter 10 ou 11 dígitos.");
  });
});

describe("excluirPaciente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("lança erro quando rate limit é excedido", async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    await expect(excluirPaciente("00000000-0000-0000-0000-000000000001")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("lança erro quando ID é inválido", async () => {
    await expect(excluirPaciente("invalido")).rejects.toThrow("ID inválido.");
  });

  it("redireciona após exclusão com sucesso", async () => {
    await expect(excluirPaciente("00000000-0000-0000-0000-000000000001")).rejects.toThrow("REDIRECT");
    expect(mockDelete).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes?success=Paciente+exclu%C3%ADdo");
  });

  it("lança erro quando exclusão falha", async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: "DB error" } });
    await expect(excluirPaciente("00000000-0000-0000-0000-000000000001")).rejects.toThrow("Erro ao excluir paciente.");
  });

  it("bloqueia papel secretaria de excluir paciente", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinic-1",
      clinicaNome: "Clínica Teste",
      papel: "secretaria",
      userId: "user-2",
    });
    await expect(excluirPaciente("00000000-0000-0000-0000-000000000001")).rejects.toThrow("Sem permissão para excluir pacientes.");
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe("RBAC pacientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    insertResponse = { data: null, error: null };
  });

  it("criarPaciente bloqueia papel financeiro", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinic-1",
      clinicaNome: "Clínica Teste",
      papel: "financeiro",
      userId: "user-2",
    });
    const result = await criarPaciente({}, makeFormData({ nome: "João" }));
    expect(result.error).toBe("Sem permissão para criar pacientes.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("atualizarPaciente bloqueia papel financeiro", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinic-1",
      clinicaNome: "Clínica Teste",
      papel: "financeiro",
      userId: "user-2",
    });
    const result = await atualizarPaciente({}, makeFormData({ id: "00000000-0000-0000-0000-000000000001", nome: "Maria" }));
    expect(result.error).toBe("Sem permissão para atualizar pacientes.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("criarPacienteRapido bloqueia papel financeiro", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinic-1",
      clinicaNome: "Clínica Teste",
      papel: "financeiro",
      userId: "user-2",
    });
    const result = await criarPacienteRapido({ nome: "João" });
    expect(result.error).toBe("Sem permissão para criar pacientes.");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
