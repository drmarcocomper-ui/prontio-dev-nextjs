import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEq = vi.fn().mockReturnValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: (col: string, val: string) => { mockEq(col, val); return { error: null }; },
});
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ error: null }) }) });
const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });
const mockSelectClinica = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { ativo: true }, error: null }),
  }),
});
const mockDeleteClinica = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ error: null }),
});
const mockAdminCreateUser = vi.fn().mockResolvedValue({
  data: { user: { id: "new-user-id" } },
  error: null,
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "clinicas") {
          return {
            update: (data: unknown) => mockUpdate(data),
            select: (cols: string) => mockSelectClinica(cols),
            delete: () => mockDeleteClinica(),
          };
        }
        return {
          insert: (rows: unknown) => mockInsert(rows),
          delete: () => mockDelete(),
        };
      },
      auth: {
        updateUser: (data: unknown) => mockUpdateUser(data),
      },
    }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        createUser: (data: unknown) => mockAdminCreateUser(data),
      },
    },
  }),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinica-123",
    clinicaNome: "Clínica Teste",
    papel: "medico",
    userId: "user-456",
  }),
  getMedicoId: vi.fn().mockResolvedValue("user-456"),
}));

import { salvarConsultorio, salvarHorarios, salvarProfissional, alterarSenha, criarUsuario, editarClinica, alternarStatusClinica, excluirClinica } from "./actions";
import { getClinicaAtual } from "@/lib/clinica";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("salvarConsultorio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando nome está vazio", async () => {
    const result = await salvarConsultorio({}, makeFormData({ nome: "" }));
    expect(result.error).toBe("Nome do consultório é obrigatório.");
  });

  it("salva consultório com sucesso", async () => {
    const result = await salvarConsultorio({}, makeFormData({
      nome: "Clínica Teste",
      cnpj: "12345678000100",
    }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Clínica Teste",
        cnpj: "12345678000100",
      })
    );
  });

  it("retorna erro quando nome excede max length", async () => {
    const longName = "a".repeat(256);
    const result = await salvarConsultorio({}, makeFormData({ nome: longName }));
    expect(result.error).toBe("Nome excede 255 caracteres.");
  });

  it("retorna erro quando clínica não está selecionada", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await salvarConsultorio({}, makeFormData({ nome: "Clínica" }));
    expect(result.error).toBe("Clínica não selecionada.");
  });

  it("retorna erro quando CNPJ tem menos de 14 dígitos", async () => {
    const result = await salvarConsultorio({}, makeFormData({ nome: "Clínica", cnpj: "1234567" }));
    expect(result.error).toBe("CNPJ deve ter 14 dígitos.");
  });

  it("retorna erro quando telefone é inválido", async () => {
    const result = await salvarConsultorio({}, makeFormData({ nome: "Clínica", telefone: "123" }));
    expect(result.error).toBe("Telefone deve ter 10 ou 11 dígitos.");
  });

  it("retorna erro quando estado é inválido", async () => {
    const result = await salvarConsultorio({}, makeFormData({ nome: "Clínica", estado: "XX" }));
    expect(result.error).toBe("Estado inválido.");
  });

  it("aceita estado válido", async () => {
    const result = await salvarConsultorio({}, makeFormData({ nome: "Clínica", estado: "SP" }));
    expect(result.success).toBe(true);
  });
});

describe("salvarHorarios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("salva horários com sucesso", async () => {
    const result = await salvarHorarios({}, makeFormData({
      config_duracao_consulta: "30",
      config_horario_seg_inicio: "08:00",
      config_horario_seg_fim: "18:00",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        { chave: "duracao_consulta", valor: "30", clinica_id: "clinica-123" },
        { chave: "horario_seg_inicio", valor: "08:00", clinica_id: "clinica-123" },
        { chave: "horario_seg_fim", valor: "18:00", clinica_id: "clinica-123" },
      ])
    );
  });

  it("ignora campos que não começam com config_", async () => {
    const result = await salvarHorarios({}, makeFormData({
      config_duracao_consulta: "30",
      outro_campo: "valor",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "duracao_consulta", valor: "30", clinica_id: "clinica-123" },
    ]);
  });

  it("ignora chaves fora do allowlist de horários", async () => {
    const result = await salvarHorarios({}, makeFormData({
      config_duracao_consulta: "30",
      config_chave_maliciosa: "hacked",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "duracao_consulta", valor: "30", clinica_id: "clinica-123" },
    ]);
  });

  it("retorna sucesso quando não há entradas", async () => {
    const result = await salvarHorarios({}, makeFormData({}));
    expect(result.success).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna erro quando clínica não está selecionada", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await salvarHorarios({}, makeFormData({ config_duracao_consulta: "30" }));
    expect(result.error).toBe("Clínica não selecionada.");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await salvarHorarios({}, makeFormData({
      config_duracao_consulta: "30",
    }));
    expect(result.error).toContain("Erro ao salvar horários");
  });
});

describe("salvarProfissional", () => {
  beforeEach(() => vi.clearAllMocks());

  it("salva dados profissionais com sucesso", async () => {
    const result = await salvarProfissional({}, makeFormData({
      config_nome_profissional: "Dr. João",
      config_especialidade: "Cardiologia",
      config_crm: "CRM/SP 123456",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        { chave: "nome_profissional", valor: "Dr. João", user_id: "user-456" },
        { chave: "especialidade", valor: "Cardiologia", user_id: "user-456" },
        { chave: "crm", valor: "CRM/SP 123456", user_id: "user-456" },
      ])
    );
  });

  it("ignora chaves fora do allowlist de profissional", async () => {
    const result = await salvarProfissional({}, makeFormData({
      config_nome_profissional: "Dr. João",
      config_chave_maliciosa: "hacked",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "nome_profissional", valor: "Dr. João", user_id: "user-456" },
    ]);
  });

  it("retorna erro quando contexto não encontrado", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await salvarProfissional({}, makeFormData({ config_nome_profissional: "Dr." }));
    expect(result.error).toBe("Contexto não encontrado.");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await salvarProfissional({}, makeFormData({
      config_nome_profissional: "Dr. João",
    }));
    expect(result.error).toContain("Erro ao salvar profissional");
  });

  it("retorna erro quando campo excede max length", async () => {
    const longName = "a".repeat(256);
    const result = await salvarProfissional({}, makeFormData({
      config_nome_profissional: longName,
    }));
    expect(result.error).toBe("Campo excede 255 caracteres.");
  });

  it("retorna erro quando email_profissional é inválido", async () => {
    const result = await salvarProfissional({}, makeFormData({
      config_email_profissional: "email-invalido",
    }));
    expect(result.error).toBe("E-mail inválido.");
  });

  it("aceita email_profissional válido", async () => {
    const result = await salvarProfissional({}, makeFormData({
      config_email_profissional: "dr@clinica.com",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "email_profissional", valor: "dr@clinica.com", user_id: "user-456" },
    ]);
  });
});

describe("alterarSenha", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando senha é curta", async () => {
    const result = await alterarSenha({}, makeFormData({ new_password: "123", confirm_password: "123" }));
    expect(result.error).toBe("A senha deve ter pelo menos 6 caracteres.");
  });

  it("retorna erro quando senhas não coincidem", async () => {
    const result = await alterarSenha({}, makeFormData({ new_password: "123456", confirm_password: "654321" }));
    expect(result.error).toBe("As senhas não coincidem.");
  });

  it("altera senha com sucesso", async () => {
    const result = await alterarSenha({}, makeFormData({ new_password: "novaSenha123", confirm_password: "novaSenha123" }));
    expect(result.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "novaSenha123" });
  });

  it("retorna erro quando senha excede max length", async () => {
    const longPassword = "a".repeat(129);
    const result = await alterarSenha({}, makeFormData({ new_password: longPassword, confirm_password: longPassword }));
    expect(result.error).toBe("A senha deve ter no máximo 128 caracteres.");
  });

  it("retorna erro quando updateUser falha", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: { message: "Auth error" } });
    const result = await alterarSenha({}, makeFormData({ new_password: "novaSenha123", confirm_password: "novaSenha123" }));
    expect(result.error).toBe("Erro ao alterar senha. Tente novamente.");
  });
});

describe("criarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: "new-user-id" } },
      error: null,
    });
  });

  it("retorna erro quando email está vazio", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "", senha: "123456", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("E-mail é obrigatório.");
  });

  it("retorna erro quando email é inválido", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "invalido", senha: "123456", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("E-mail inválido.");
  });

  it("retorna erro quando email excede max length", async () => {
    const longEmail = "a".repeat(250) + "@b.co";
    const result = await criarUsuario({}, makeFormData({ email: longEmail, senha: "123456", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("E-mail excede 254 caracteres.");
  });

  it("retorna erro quando senha é curta", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("A senha deve ter pelo menos 6 caracteres.");
  });

  it("retorna erro quando senha excede max length", async () => {
    const longPass = "a".repeat(129);
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: longPass, papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("A senha deve ter no máximo 128 caracteres.");
  });

  it("retorna erro quando papel é inválido", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "admin", clinica_id: "clinica-123" }));
    expect(result.error).toBe("Papel inválido.");
  });

  it("retorna erro quando clinica_id está vazio", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "" }));
    expect(result.error).toBe("Selecione uma clínica.");
  });

  it("retorna erro quando não tem permissão (secretaria)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinica-123", clinicaNome: "Teste", papel: "secretaria", userId: "u-1",
    });
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("Sem permissão para criar usuários.");
  });

  it("retorna erro quando email já existe", async () => {
    mockAdminCreateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "A user with this email address has already been registered" },
    });
    const result = await criarUsuario({}, makeFormData({ email: "dup@test.com", senha: "123456", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("Já existe um usuário com este e-mail.");
  });

  it("retorna erro genérico quando createUser falha", async () => {
    mockAdminCreateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Unknown error" },
    });
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("Erro ao criar usuário. Tente novamente.");
  });

  it("cria usuário com sucesso", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "novo@test.com", senha: "senhaSegura", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.success).toBe(true);
    expect(mockAdminCreateUser).toHaveBeenCalledWith({
      email: "novo@test.com",
      password: "senhaSegura",
      email_confirm: true,
    });
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "new-user-id",
      clinica_id: "clinica-123",
      papel: "secretaria",
    });
  });

  it("cria médico com sucesso", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "dr@test.com", senha: "senhaSegura", papel: "medico", clinica_id: "clinica-123" }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "new-user-id",
      clinica_id: "clinica-123",
      papel: "medico",
    });
  });

  it("permite admin criar usuários", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinica-123", clinicaNome: "Teste", papel: "admin", userId: "u-1",
    });
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.success).toBe(true);
  });

  it("retorna erro quando vínculo duplicado (23505)", async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: "23505", message: "duplicate" } });
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "clinica-123" }));
    expect(result.error).toBe("Este usuário já está vinculado a esta clínica.");
  });
});

describe("editarClinica", () => {
  beforeEach(() => vi.clearAllMocks());

  it("edita nome da clínica com sucesso", async () => {
    const result = await editarClinica({}, makeFormData({ clinica_id: "c-1", nome: "Nova Clínica" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ nome: "Nova Clínica" });
    expect(mockEq).toHaveBeenCalledWith("id", "c-1");
  });

  it("retorna erro quando nome está vazio", async () => {
    const result = await editarClinica({}, makeFormData({ clinica_id: "c-1", nome: "" }));
    expect(result.error).toBe("Nome é obrigatório.");
  });

  it("retorna erro quando nome excede max length", async () => {
    const longName = "a".repeat(256);
    const result = await editarClinica({}, makeFormData({ clinica_id: "c-1", nome: longName }));
    expect(result.error).toBe("Nome excede 255 caracteres.");
  });

  it("retorna erro quando clinica_id está vazio", async () => {
    const result = await editarClinica({}, makeFormData({ clinica_id: "", nome: "Clínica" }));
    expect(result.error).toBe("Clínica não identificada.");
  });

  it("retorna erro quando não tem permissão (secretaria)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "c-1", clinicaNome: "Teste", papel: "secretaria", userId: "u-1",
    });
    const result = await editarClinica({}, makeFormData({ clinica_id: "c-1", nome: "Clínica" }));
    expect(result.error).toBe("Sem permissão para editar clínicas.");
  });

  it("retorna erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await editarClinica({}, makeFormData({ clinica_id: "c-1", nome: "Clínica" }));
    expect(result.error).toBe("Sem permissão para editar clínicas.");
  });

  it("permite admin editar", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "c-1", clinicaNome: "Teste", papel: "admin", userId: "u-1",
    });
    const result = await editarClinica({}, makeFormData({ clinica_id: "c-1", nome: "Clínica Admin" }));
    expect(result.success).toBe(true);
  });

  it("retorna erro quando update falha", async () => {
    mockUpdate.mockReturnValueOnce({ eq: () => ({ error: { message: "DB error" } }) });
    const result = await editarClinica({}, makeFormData({ clinica_id: "c-1", nome: "Clínica" }));
    expect(result.error).toContain("Erro ao atualizar clínica");
  });
});

describe("alternarStatusClinica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { ativo: true }, error: null }),
      }),
    });
  });

  it("alterna de ativo para inativo", async () => {
    await alternarStatusClinica("c-1");
    expect(mockSelectClinica).toHaveBeenCalledWith("ativo");
    expect(mockUpdate).toHaveBeenCalledWith({ ativo: false });
  });

  it("alterna de inativo para ativo", async () => {
    mockSelectClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { ativo: false }, error: null }),
      }),
    });
    await alternarStatusClinica("c-1");
    expect(mockUpdate).toHaveBeenCalledWith({ ativo: true });
  });

  it("lança erro quando não tem permissão (secretaria)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "c-1", clinicaNome: "Teste", papel: "secretaria", userId: "u-1",
    });
    await expect(alternarStatusClinica("c-1")).rejects.toThrow("Sem permissão para alterar status de clínicas.");
  });

  it("lança erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    await expect(alternarStatusClinica("c-1")).rejects.toThrow("Sem permissão para alterar status de clínicas.");
  });

  it("lança erro quando clínica não é encontrada", async () => {
    mockSelectClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      }),
    });
    await expect(alternarStatusClinica("c-999")).rejects.toThrow("Clínica não encontrada.");
  });

  it("lança erro quando update falha", async () => {
    mockUpdate.mockReturnValueOnce({ eq: () => ({ error: { message: "DB error" } }) });
    await expect(alternarStatusClinica("c-1")).rejects.toThrow("Erro ao atualizar clínica");
  });

  it("permite admin alternar status", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "c-1", clinicaNome: "Teste", papel: "admin", userId: "u-1",
    });
    await alternarStatusClinica("c-1");
    expect(mockUpdate).toHaveBeenCalledWith({ ativo: false });
  });
});

describe("excluirClinica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: null }),
    });
  });

  it("exclui clínica com sucesso", async () => {
    await excluirClinica("c-1");
    expect(mockDeleteClinica).toHaveBeenCalled();
  });

  it("lança erro quando não tem permissão (secretaria)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "c-1", clinicaNome: "Teste", papel: "secretaria", userId: "u-1",
    });
    await expect(excluirClinica("c-1")).rejects.toThrow("Sem permissão para excluir clínicas.");
  });

  it("lança erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    await expect(excluirClinica("c-1")).rejects.toThrow("Sem permissão para excluir clínicas.");
  });

  it("lança erro quando delete falha", async () => {
    mockDeleteClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: { message: "FK constraint" } }),
    });
    await expect(excluirClinica("c-1")).rejects.toThrow("Erro ao excluir clínica");
  });

  it("permite admin excluir", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "c-1", clinicaNome: "Teste", papel: "admin", userId: "u-1",
    });
    await excluirClinica("c-1");
    expect(mockDeleteClinica).toHaveBeenCalled();
  });
});
