import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEq = vi.fn().mockReturnValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: (col: string, val: string) => { mockEq(col, val); return { error: null }; },
});
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ error: null }) }) });
const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: "00000000-0000-0000-0000-000000000002", email: "user@test.com" } } });
const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });
const mockSelectClinica = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { ativo: true }, error: null }),
  }),
});
const mockDeleteClinica = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ error: null }),
});
let mockAgendamentosCount = 0;
const mockAdminCreateUser = vi.fn().mockResolvedValue({
  data: { user: { id: "new-user-id" } },
  error: null,
});
const mockInsertClinicaSelect = vi.fn().mockReturnValue({
  single: vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000099" }, error: null }),
});
const mockInsertClinica = vi.fn().mockReturnValue({
  select: () => mockInsertClinicaSelect(),
});
const mockInsertVinculo = vi.fn().mockResolvedValue({ error: null });
const mockUpsertHorarios = vi.fn().mockResolvedValue({ error: null });
const mockInsertCatalogoExame = vi.fn().mockResolvedValue({ error: null });
const mockUpdateCatalogoExame = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ error: null }),
});
const mockDeleteCatalogoExame = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ error: null }),
});
const mockInsertMedicamento = vi.fn().mockResolvedValue({ error: null });
const mockUpdateMedicamento = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ error: null }),
});
const mockDeleteMedicamento = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ error: null }),
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/(dashboard)/agenda/utils", () => ({ invalidarCacheHorario: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 4, resetIn: 900000 }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "clinicas") {
          return {
            insert: (data: unknown) => mockInsertClinica(data),
            update: (data: unknown) => mockUpdate(data),
            select: (cols: string) => mockSelectClinica(cols),
            delete: () => mockDeleteClinica(),
          };
        }
        if (table === "agendamentos") {
          return {
            select: () => ({
              eq: () => Promise.resolve({ count: mockAgendamentosCount, error: null }),
            }),
          };
        }
        if (table === "usuarios_clinicas") {
          return {
            insert: (rows: unknown) => mockInsertVinculo(rows),
          };
        }
        if (table === "horarios_profissional") {
          return {
            upsert: (rows: unknown, opts: unknown) => mockUpsertHorarios(rows, opts),
          };
        }
        if (table === "catalogo_exames") {
          return {
            insert: (rows: unknown) => mockInsertCatalogoExame(rows),
            update: (data: unknown) => mockUpdateCatalogoExame(data),
            delete: () => mockDeleteCatalogoExame(),
          };
        }
        if (table === "medicamentos") {
          return {
            insert: (rows: unknown) => mockInsertMedicamento(rows),
            update: (data: unknown) => mockUpdateMedicamento(data),
            delete: () => mockDeleteMedicamento(),
          };
        }
        return {
          insert: (rows: unknown) => mockInsert(rows),
          delete: () => mockDelete(),
        };
      },
      auth: {
        updateUser: (data: unknown) => mockUpdateUser(data),
        getUser: () => mockGetUser(),
        signInWithPassword: (data: unknown) => mockSignInWithPassword(data),
      },
    }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
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
      admin: {
        createUser: (data: unknown) => mockAdminCreateUser(data),
      },
    },
  }),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "00000000-0000-0000-0000-000000000001",
    clinicaNome: "Clínica Teste",
    papel: "gestor",
    userId: "00000000-0000-0000-0000-000000000002",
  }),
  getClinicasDoUsuario: vi.fn().mockResolvedValue([
    { id: "00000000-0000-0000-0000-000000000001", nome: "Clínica Teste", papel: "gestor" },
  ]),
  getMedicoId: vi.fn().mockResolvedValue("00000000-0000-0000-0000-000000000002"),
  isGestor: (papel: string) => papel === "superadmin" || papel === "gestor",
  isProfissional: (papel: string) => papel === "superadmin" || papel === "profissional_saude",
}));

import { salvarConsultorio, salvarHorarios, salvarProfissional, salvarValores, alterarSenha, editarClinica, alternarStatusClinica, excluirClinica, criarClinica, salvarHorariosProfissional, criarCatalogoExame, atualizarCatalogoExame, excluirCatalogoExame, criarMedicamento, atualizarMedicamento, excluirMedicamento } from "./actions";
import { getClinicaAtual, getClinicasDoUsuario } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("salvarConsultorio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await salvarConsultorio({}, makeFormData({ nome: "Clínica" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

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
    expect(result.error).toBe("Telefone 1 deve ter entre 8 e 11 dígitos.");
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

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await salvarHorarios({}, makeFormData({ config_duracao_consulta: "30" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("salva horários com sucesso", async () => {
    const result = await salvarHorarios({}, makeFormData({
      config_duracao_consulta: "30",
      config_horario_seg_inicio: "08:00",
      config_horario_seg_fim: "18:00",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        { chave: "duracao_consulta", valor: "30", clinica_id: "00000000-0000-0000-0000-000000000001" },
        { chave: "horario_seg_inicio", valor: "08:00", clinica_id: "00000000-0000-0000-0000-000000000001" },
        { chave: "horario_seg_fim", valor: "18:00", clinica_id: "00000000-0000-0000-0000-000000000001" },
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
      { chave: "duracao_consulta", valor: "30", clinica_id: "00000000-0000-0000-0000-000000000001" },
    ]);
  });

  it("ignora chaves fora do allowlist de horários", async () => {
    const result = await salvarHorarios({}, makeFormData({
      config_duracao_consulta: "30",
      config_chave_maliciosa: "hacked",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "duracao_consulta", valor: "30", clinica_id: "00000000-0000-0000-0000-000000000001" },
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

  it("retorna erro quando delete falha", async () => {
    mockDelete.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
      }),
    });
    const result = await salvarHorarios({}, makeFormData({
      config_duracao_consulta: "30",
    }));
    expect(result.error).toContain("Erro ao salvar horários");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("salvarValores", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await salvarValores({}, makeFormData({ config_valor_convenio_bradesco: "350,00" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("salva valores com sucesso", async () => {
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_bradesco: "350,00",
      config_valor_convenio_unimed: "400,00",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        { chave: "valor_convenio_bradesco", valor: "350.00", clinica_id: "00000000-0000-0000-0000-000000000001" },
        { chave: "valor_convenio_unimed", valor: "400.00", clinica_id: "00000000-0000-0000-0000-000000000001" },
      ])
    );
  });

  it("ignora chaves fora do allowlist de valores", async () => {
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_bradesco: "350,00",
      config_chave_maliciosa: "hacked",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "valor_convenio_bradesco", valor: "350.00", clinica_id: "00000000-0000-0000-0000-000000000001" },
    ]);
  });

  it("ignora cortesia (não deve estar no allowlist)", async () => {
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_cortesia: "100,00",
      config_valor_convenio_particular: "500,00",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "valor_convenio_particular", valor: "500.00", clinica_id: "00000000-0000-0000-0000-000000000001" },
    ]);
  });

  it("ignora valores vazios", async () => {
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_bradesco: "",
      config_valor_convenio_unimed: "400,00",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "valor_convenio_unimed", valor: "400.00", clinica_id: "00000000-0000-0000-0000-000000000001" },
    ]);
  });

  it("retorna sucesso quando todos os valores estão vazios", async () => {
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_bradesco: "",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna erro quando clínica não está selecionada", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await salvarValores({}, makeFormData({ config_valor_convenio_bradesco: "350,00" }));
    expect(result.error).toBe("Clínica não selecionada.");
  });

  it("retorna erro quando insert falha", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_bradesco: "350,00",
    }));
    expect(result.error).toContain("Erro ao salvar valores");
  });

  it("converte valores com separador de milhar corretamente", async () => {
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_bradesco: "1.350,00",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith([
      { chave: "valor_convenio_bradesco", valor: "1350.00", clinica_id: "00000000-0000-0000-0000-000000000001" },
    ]);
  });

  it("ignora valores negativos", async () => {
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_bradesco: "-50,00",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("retorna erro quando delete falha", async () => {
    mockDelete.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
      }),
    });
    const result = await salvarValores({}, makeFormData({
      config_valor_convenio_bradesco: "350,00",
    }));
    expect(result.error).toContain("Erro ao salvar valores");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("salvarProfissional", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await salvarProfissional({}, makeFormData({ config_nome_profissional: "Dr." }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("salva dados profissionais com sucesso", async () => {
    const result = await salvarProfissional({}, makeFormData({
      config_nome_profissional: "Dr. João",
      config_especialidade: "Cardiologia",
      config_crm: "CRM/SP 123456",
    }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        { chave: "nome_profissional", valor: "Dr. João", user_id: "00000000-0000-0000-0000-000000000002" },
        { chave: "especialidade", valor: "Cardiologia", user_id: "00000000-0000-0000-0000-000000000002" },
        { chave: "crm", valor: "CRM/SP 123456", user_id: "00000000-0000-0000-0000-000000000002" },
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
      { chave: "nome_profissional", valor: "Dr. João", user_id: "00000000-0000-0000-0000-000000000002" },
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
      { chave: "email_profissional", valor: "dr@clinica.com", user_id: "00000000-0000-0000-0000-000000000002" },
    ]);
  });

  it("retorna erro quando delete falha", async () => {
    mockDelete.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
      }),
    });
    const result = await salvarProfissional({}, makeFormData({
      config_nome_profissional: "Dr. João",
    }));
    expect(result.error).toContain("Erro ao salvar profissional");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("alterarSenha", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando senha atual não é informada", async () => {
    const result = await alterarSenha({}, makeFormData({ current_password: "", new_password: "123456", confirm_password: "123456" }));
    expect(result.error).toBe("Informe a senha atual.");
  });

  it("retorna erro quando nova senha é curta", async () => {
    const result = await alterarSenha({}, makeFormData({ current_password: "atual123", new_password: "123", confirm_password: "123" }));
    expect(result.error).toBe("A senha deve ter pelo menos 6 caracteres.");
  });

  it("retorna erro quando senhas não coincidem", async () => {
    const result = await alterarSenha({}, makeFormData({ current_password: "atual123", new_password: "123456", confirm_password: "654321" }));
    expect(result.error).toBe("As senhas não coincidem.");
  });

  it("retorna erro quando senha atual está incorreta", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: "Invalid login credentials" } });
    const result = await alterarSenha({}, makeFormData({ current_password: "errada", new_password: "novaSenha123", confirm_password: "novaSenha123" }));
    expect(result.error).toBe("Senha atual incorreta.");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("verifica senha atual via signInWithPassword", async () => {
    await alterarSenha({}, makeFormData({ current_password: "senhaAtual", new_password: "novaSenha123", confirm_password: "novaSenha123" }));
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@test.com",
      password: "senhaAtual",
    });
  });

  it("altera senha com sucesso", async () => {
    const result = await alterarSenha({}, makeFormData({ current_password: "senhaAtual", new_password: "novaSenha123", confirm_password: "novaSenha123" }));
    expect(result.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "novaSenha123" });
  });

  it("retorna erro quando senha excede max length", async () => {
    const longPassword = "a".repeat(129);
    const result = await alterarSenha({}, makeFormData({ current_password: "atual123", new_password: longPassword, confirm_password: longPassword }));
    expect(result.error).toBe("A senha deve ter no máximo 128 caracteres.");
  });

  it("retorna erro quando updateUser falha", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: { message: "Auth error" } });
    const result = await alterarSenha({}, makeFormData({ current_password: "senhaAtual", new_password: "novaSenha123", confirm_password: "novaSenha123" }));
    expect(result.error).toBe("Erro ao alterar senha. Tente novamente.");
  });

  it("retorna erro quando usuário não está autenticado", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await alterarSenha({}, makeFormData({ current_password: "senhaAtual", new_password: "novaSenha123", confirm_password: "novaSenha123" }));
    expect(result.error).toBe("Usuário não autenticado.");
  });

  it("retorna erro quando rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await alterarSenha({}, makeFormData({ current_password: "senhaAtual", new_password: "novaSenha123", confirm_password: "novaSenha123" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});

describe("editarClinica", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000001", nome: "Nova" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("edita nome da clínica com sucesso", async () => {
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000001", nome: "Nova Clínica" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ nome: "Nova Clínica" }));
    expect(mockEq).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000001");
  });

  it("retorna erro quando nome está vazio", async () => {
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000001", nome: "" }));
    expect(result.error).toBe("Nome é obrigatório.");
  });

  it("retorna erro quando nome excede max length", async () => {
    const longName = "a".repeat(256);
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000001", nome: longName }));
    expect(result.error).toBe("Nome excede 255 caracteres.");
  });

  it("retorna erro quando clinica_id está vazio", async () => {
    const result = await editarClinica({}, makeFormData({ clinica_id: "", nome: "Clínica" }));
    expect(result.error).toBe("Clínica não identificada.");
  });

  it("retorna erro quando clinicaId não pertence ao usuário", async () => {
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000099", nome: "Clínica" }));
    expect(result.error).toBe("Você não tem acesso a esta clínica.");
  });

  it("retorna erro quando não tem permissão (secretaria)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000003", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000004",
    });
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000003", nome: "Clínica" }));
    expect(result.error).toBe("Sem permissão para editar clínicas.");
  });

  it("retorna erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000003", nome: "Clínica" }));
    expect(result.error).toBe("Sem permissão para editar clínicas.");
  });

  it("permite superadmin editar", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "superadmin", userId: "00000000-0000-0000-0000-000000000004",
    });
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000001", nome: "Clínica Admin" }));
    expect(result.success).toBe(true);
  });

  it("retorna erro quando update falha", async () => {
    mockUpdate.mockReturnValueOnce({ eq: () => ({ error: { message: "DB error" } }) });
    const result = await editarClinica({}, makeFormData({ clinica_id: "00000000-0000-0000-0000-000000000001", nome: "Clínica" }));
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

  it("lança erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    await expect(alternarStatusClinica("00000000-0000-0000-0000-000000000001")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockSelectClinica).not.toHaveBeenCalledWith("ativo");
  });

  it("alterna de ativo para inativo", async () => {
    await alternarStatusClinica("00000000-0000-0000-0000-000000000001");
    expect(mockSelectClinica).toHaveBeenCalledWith("ativo");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
  });

  it("alterna de inativo para ativo", async () => {
    mockSelectClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { ativo: false }, error: null }),
      }),
    });
    await alternarStatusClinica("00000000-0000-0000-0000-000000000001");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ ativo: true }));
  });

  it("lança erro quando não tem permissão (secretaria)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000003", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000004",
    });
    await expect(alternarStatusClinica("00000000-0000-0000-0000-000000000003")).rejects.toThrow("Sem permissão para alterar status de clínicas.");
  });

  it("lança erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    await expect(alternarStatusClinica("00000000-0000-0000-0000-000000000003")).rejects.toThrow("Sem permissão para alterar status de clínicas.");
  });

  it("lança erro quando clinicaId não pertence ao usuário", async () => {
    await expect(alternarStatusClinica("00000000-0000-0000-0000-000000000099")).rejects.toThrow("Você não tem acesso a esta clínica.");
  });

  it("lança erro quando clínica não é encontrada no DB", async () => {
    vi.mocked(getClinicasDoUsuario).mockResolvedValueOnce([
      { id: "00000000-0000-0000-0000-000000000001", nome: "Clínica Teste", papel: "gestor" },
      { id: "00000000-0000-0000-0000-000000000088", nome: "Fantasma", papel: "gestor" },
    ]);
    mockSelectClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      }),
    });
    await expect(alternarStatusClinica("00000000-0000-0000-0000-000000000088")).rejects.toThrow("Clínica não encontrada.");
  });

  it("lança erro quando update falha", async () => {
    mockUpdate.mockReturnValueOnce({ eq: () => ({ error: { message: "DB error" } }) });
    await expect(alternarStatusClinica("00000000-0000-0000-0000-000000000001")).rejects.toThrow("Erro ao atualizar clínica");
  });

  it("permite superadmin alternar status", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "superadmin", userId: "00000000-0000-0000-0000-000000000004",
    });
    await alternarStatusClinica("00000000-0000-0000-0000-000000000001");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
  });
});

describe("excluirClinica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAgendamentosCount = 0;
    mockDeleteClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: null }),
    });
    // Incluir clínica-88 na lista para testes de exclusão (diferente da ativa)
    vi.mocked(getClinicasDoUsuario).mockResolvedValue([
      { id: "00000000-0000-0000-0000-000000000001", nome: "Clínica Teste", papel: "gestor" },
      { id: "00000000-0000-0000-0000-000000000088", nome: "Outra Clínica", papel: "gestor" },
    ]);
  });

  it("lança erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    await expect(excluirClinica("00000000-0000-0000-0000-000000000088")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockDeleteClinica).not.toHaveBeenCalled();
  });

  it("exclui clínica com sucesso", async () => {
    await excluirClinica("00000000-0000-0000-0000-000000000088");
    expect(mockDeleteClinica).toHaveBeenCalled();
  });

  it("lança erro ao tentar excluir a clínica ativa", async () => {
    await expect(excluirClinica("00000000-0000-0000-0000-000000000001")).rejects.toThrow("Não é possível excluir a clínica ativa.");
  });

  it("lança erro quando não tem permissão (secretaria)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000003", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000004",
    });
    await expect(excluirClinica("00000000-0000-0000-0000-000000000003")).rejects.toThrow("Sem permissão para excluir clínicas.");
  });

  it("lança erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    await expect(excluirClinica("00000000-0000-0000-0000-000000000003")).rejects.toThrow("Sem permissão para excluir clínicas.");
  });

  it("lança erro quando clinicaId não pertence ao usuário", async () => {
    await expect(excluirClinica("00000000-0000-0000-0000-000000000099")).rejects.toThrow("Você não tem acesso a esta clínica.");
  });

  it("lança erro quando delete falha", async () => {
    mockDeleteClinica.mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: { message: "FK constraint" } }),
    });
    await expect(excluirClinica("00000000-0000-0000-0000-000000000088")).rejects.toThrow("Erro ao excluir clínica");
  });

  it("permite superadmin excluir", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000003", clinicaNome: "Teste", papel: "superadmin", userId: "00000000-0000-0000-0000-000000000004",
    });
    vi.mocked(getClinicasDoUsuario).mockResolvedValueOnce([
      { id: "00000000-0000-0000-0000-000000000088", nome: "Outra", papel: "superadmin" },
    ]);
    await excluirClinica("00000000-0000-0000-0000-000000000088");
    expect(mockDeleteClinica).toHaveBeenCalled();
  });
});

// ============================================
// criarClinica
// ============================================

describe("criarClinica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertClinicaSelect.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: "00000000-0000-0000-0000-000000000099" }, error: null }),
    });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await criarClinica({}, makeFormData({ nome: "Nova Clínica" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsertClinica).not.toHaveBeenCalled();
  });

  it("retorna erro quando nome está vazio", async () => {
    const result = await criarClinica({}, makeFormData({ nome: "" }));
    expect(result.error).toBe("Nome é obrigatório.");
  });

  it("retorna erro quando nome excede max length", async () => {
    const longName = "a".repeat(256);
    const result = await criarClinica({}, makeFormData({ nome: longName }));
    expect(result.error).toBe("Nome excede 255 caracteres.");
  });

  it("retorna erro quando contexto é null (sem permissão)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await criarClinica({}, makeFormData({ nome: "Nova Clínica" }));
    expect(result.error).toBe("Sem permissão para criar clínicas.");
  });

  it("retorna erro quando papel não é gestor", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000002",
    });
    const result = await criarClinica({}, makeFormData({ nome: "Nova Clínica" }));
    expect(result.error).toBe("Sem permissão para criar clínicas.");
  });

  it("retorna erro quando usuário não está autenticado", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await criarClinica({}, makeFormData({ nome: "Nova Clínica" }));
    expect(result.error).toBe("Usuário não autenticado.");
  });

  it("cria clínica com sucesso (gestor)", async () => {
    const result = await criarClinica({}, makeFormData({ nome: "Nova Clínica" }));
    expect(result.success).toBe(true);
    expect(mockInsertClinica).toHaveBeenCalledWith({ nome: "Nova Clínica" });
    expect(mockInsertVinculo).toHaveBeenCalledWith({
      user_id: "00000000-0000-0000-0000-000000000002",
      clinica_id: "00000000-0000-0000-0000-000000000099",
      papel: "gestor",
    });
  });

  it("preserva papel superadmin no vínculo", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "superadmin", userId: "00000000-0000-0000-0000-000000000002",
    });
    const result = await criarClinica({}, makeFormData({ nome: "Nova Clínica" }));
    expect(result.success).toBe(true);
    expect(mockInsertVinculo).toHaveBeenCalledWith(
      expect.objectContaining({ papel: "superadmin" }),
    );
  });

  it("retorna erro quando insert da clínica falha", async () => {
    mockInsertClinicaSelect.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    });
    const result = await criarClinica({}, makeFormData({ nome: "Nova Clínica" }));
    expect(result.error).toContain("Erro ao criar clínica");
  });

  it("retorna erro quando insert do vínculo falha", async () => {
    mockInsertVinculo.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await criarClinica({}, makeFormData({ nome: "Nova Clínica" }));
    expect(result.error).toContain("Erro ao criar vínculo");
  });
});

// ============================================
// salvarHorariosProfissional
// ============================================

function makeHorariosProfFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    duracao_consulta: "30",
    // All days inactive by default
  };
  return makeFormData({ ...defaults, ...overrides });
}

describe("salvarHorariosProfissional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: profissional_saude role
    vi.mocked(getClinicaAtual).mockResolvedValue({
      clinicaId: "00000000-0000-0000-0000-000000000001",
      clinicaNome: "Clínica Teste",
      papel: "profissional_saude",
      userId: "00000000-0000-0000-0000-000000000002",
    });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData());
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpsertHorarios).not.toHaveBeenCalled();
  });

  it("retorna erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData());
    expect(result.error).toBe("Clínica não selecionada.");
  });

  it("retorna erro quando papel não é profissional", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000002",
    });
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData());
    expect(result.error).toBe("Sem permissão para configurar horários de profissional.");
  });

  it("retorna erro quando duração é menor que 5", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({ duracao_consulta: "3" }));
    expect(result.error).toBe("Duração deve ser entre 5 e 240 minutos.");
  });

  it("retorna erro quando duração é maior que 240", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({ duracao_consulta: "300" }));
    expect(result.error).toBe("Duração deve ser entre 5 e 240 minutos.");
  });

  it("retorna erro quando duração não é número", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({ duracao_consulta: "abc" }));
    expect(result.error).toBe("Duração deve ser entre 5 e 240 minutos.");
  });

  it("retorna erro quando dia ativo não tem hora_inicio", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({
      duracao_consulta: "30",
      ativo_seg: "true",
      hora_fim_seg: "18:00",
    }));
    expect(result.error).toBe("Horário de início e fim são obrigatórios para seg.");
  });

  it("retorna erro quando dia ativo não tem hora_fim", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({
      duracao_consulta: "30",
      ativo_seg: "true",
      hora_inicio_seg: "08:00",
    }));
    expect(result.error).toBe("Horário de início e fim são obrigatórios para seg.");
  });

  it("retorna erro quando hora_fim <= hora_inicio", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({
      duracao_consulta: "30",
      ativo_seg: "true",
      hora_inicio_seg: "18:00",
      hora_fim_seg: "08:00",
    }));
    expect(result.error).toBe("Horário de término deve ser posterior ao início (seg).");
  });

  it("retorna erro quando hora_fim === hora_inicio", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({
      duracao_consulta: "30",
      ativo_ter: "true",
      hora_inicio_ter: "10:00",
      hora_fim_ter: "10:00",
    }));
    expect(result.error).toBe("Horário de término deve ser posterior ao início (ter).");
  });

  it("retorna erro quando intervalo_fim <= intervalo_inicio", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({
      duracao_consulta: "30",
      ativo_seg: "true",
      hora_inicio_seg: "08:00",
      hora_fim_seg: "18:00",
      intervalo_inicio_seg: "14:00",
      intervalo_fim_seg: "12:00",
    }));
    expect(result.error).toBe("Intervalo inválido para seg.");
  });

  it("salva horários com sucesso (todos inativos)", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData());
    expect(result.success).toBe(true);
    expect(mockUpsertHorarios).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          clinica_id: "00000000-0000-0000-0000-000000000001",
          user_id: "00000000-0000-0000-0000-000000000002",
          dia_semana: 0,
          ativo: false,
          hora_inicio: null,
          hora_fim: null,
          duracao_consulta: 30,
        }),
      ]),
      { onConflict: "clinica_id,user_id,dia_semana" },
    );
  });

  it("salva horários com dia ativo com sucesso", async () => {
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData({
      duracao_consulta: "45",
      ativo_seg: "true",
      hora_inicio_seg: "08:00",
      hora_fim_seg: "18:00",
      intervalo_inicio_seg: "12:00",
      intervalo_fim_seg: "13:00",
    }));
    expect(result.success).toBe(true);
    expect(mockUpsertHorarios).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          dia_semana: 1, // seg = index 1
          ativo: true,
          hora_inicio: "08:00",
          hora_fim: "18:00",
          intervalo_inicio: "12:00",
          intervalo_fim: "13:00",
          duracao_consulta: 45,
        }),
      ]),
      { onConflict: "clinica_id,user_id,dia_semana" },
    );
  });

  it("retorna erro quando upsert falha", async () => {
    mockUpsertHorarios.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData());
    expect(result.error).toContain("Erro ao salvar horários do profissional");
  });

  it("permite superadmin salvar horários", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "superadmin", userId: "00000000-0000-0000-0000-000000000002",
    });
    const result = await salvarHorariosProfissional({}, makeHorariosProfFormData());
    expect(result.success).toBe(true);
  });

  it("gera 7 rows (uma por dia da semana)", async () => {
    await salvarHorariosProfissional({}, makeHorariosProfFormData());
    expect(mockUpsertHorarios).toHaveBeenCalledTimes(1);
    const rows = mockUpsertHorarios.mock.calls[0][0];
    expect(rows).toHaveLength(7);
    expect(rows.map((r: { dia_semana: number }) => r.dia_semana)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

// ============================================
// criarCatalogoExame
// ============================================

describe("criarCatalogoExame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClinicaAtual).mockResolvedValue({
      clinicaId: "00000000-0000-0000-0000-000000000001",
      clinicaNome: "Clínica Teste",
      papel: "superadmin",
      userId: "00000000-0000-0000-0000-000000000002",
    });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await criarCatalogoExame({}, makeFormData({ nome: "Hemograma" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsertCatalogoExame).not.toHaveBeenCalled();
  });

  it("retorna erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await criarCatalogoExame({}, makeFormData({ nome: "Hemograma" }));
    expect(result.error).toBe("Sem permissão.");
  });

  it("retorna erro quando papel não é superadmin", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "gestor", userId: "00000000-0000-0000-0000-000000000002",
    });
    const result = await criarCatalogoExame({}, makeFormData({ nome: "Hemograma" }));
    expect(result.error).toBe("Sem permissão.");
  });

  it("retorna erro quando nome está vazio", async () => {
    const result = await criarCatalogoExame({}, makeFormData({ nome: "" }));
    expect(result.error).toBe("Nome é obrigatório.");
  });

  it("retorna erro quando nome excede 255 caracteres", async () => {
    const longName = "a".repeat(256);
    const result = await criarCatalogoExame({}, makeFormData({ nome: longName }));
    expect(result.error).toBe("Nome excede 255 caracteres.");
  });

  it("retorna erro quando codigo_tuss excede 50 caracteres", async () => {
    const longCode = "a".repeat(51);
    const result = await criarCatalogoExame({}, makeFormData({ nome: "Hemograma", codigo_tuss: longCode }));
    expect(result.error).toBe("Código TUSS excede 50 caracteres.");
  });

  it("cria exame com sucesso", async () => {
    const result = await criarCatalogoExame({}, makeFormData({ nome: "Hemograma", codigo_tuss: "40304361" }));
    expect(result.success).toBe(true);
    expect(mockInsertCatalogoExame).toHaveBeenCalledWith({ nome: "Hemograma", codigo_tuss: "40304361" });
  });

  it("cria exame sem codigo_tuss (null)", async () => {
    const result = await criarCatalogoExame({}, makeFormData({ nome: "Hemograma" }));
    expect(result.success).toBe(true);
    expect(mockInsertCatalogoExame).toHaveBeenCalledWith({ nome: "Hemograma", codigo_tuss: null });
  });

  it("retorna erro quando insert falha", async () => {
    mockInsertCatalogoExame.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await criarCatalogoExame({}, makeFormData({ nome: "Hemograma" }));
    expect(result.error).toContain("Erro ao criar exame");
  });
});

// ============================================
// atualizarCatalogoExame
// ============================================

describe("atualizarCatalogoExame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClinicaAtual).mockResolvedValue({
      clinicaId: "00000000-0000-0000-0000-000000000001",
      clinicaNome: "Clínica Teste",
      papel: "superadmin",
      userId: "00000000-0000-0000-0000-000000000002",
    });
    mockUpdateCatalogoExame.mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: null }),
    });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000010", nome: "Hemograma" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdateCatalogoExame).not.toHaveBeenCalled();
  });

  it("retorna erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000010", nome: "Hemograma" }));
    expect(result.error).toBe("Sem permissão.");
  });

  it("retorna erro quando papel não é superadmin", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "gestor", userId: "00000000-0000-0000-0000-000000000002",
    });
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000010", nome: "Hemograma" }));
    expect(result.error).toBe("Sem permissão.");
  });

  it("retorna erro quando id não é UUID válido", async () => {
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "invalid", nome: "Hemograma" }));
    expect(result.error).toBe("Exame não identificado.");
  });

  it("retorna erro quando nome está vazio", async () => {
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000010", nome: "" }));
    expect(result.error).toBe("Nome é obrigatório.");
  });

  it("retorna erro quando nome excede 255 caracteres", async () => {
    const longName = "a".repeat(256);
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000010", nome: longName }));
    expect(result.error).toBe("Nome excede 255 caracteres.");
  });

  it("retorna erro quando codigo_tuss excede 50 caracteres", async () => {
    const longCode = "a".repeat(51);
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000010", nome: "Hemograma", codigo_tuss: longCode }));
    expect(result.error).toBe("Código TUSS excede 50 caracteres.");
  });

  it("atualiza exame com sucesso", async () => {
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000010", nome: "Hemograma Completo", codigo_tuss: "40304361" }));
    expect(result.success).toBe(true);
    expect(mockUpdateCatalogoExame).toHaveBeenCalledWith({ nome: "Hemograma Completo", codigo_tuss: "40304361" });
  });

  it("retorna erro quando update falha", async () => {
    mockUpdateCatalogoExame.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({ error: { message: "DB error" } }),
    });
    const result = await atualizarCatalogoExame({}, makeFormData({ id: "00000000-0000-0000-0000-000000000010", nome: "Hemograma" }));
    expect(result.error).toContain("Erro ao atualizar exame");
  });
});

// ============================================
// excluirCatalogoExame
// ============================================

describe("excluirCatalogoExame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClinicaAtual).mockResolvedValue({
      clinicaId: "00000000-0000-0000-0000-000000000001",
      clinicaNome: "Clínica Teste",
      papel: "superadmin",
      userId: "00000000-0000-0000-0000-000000000002",
    });
    mockDeleteCatalogoExame.mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: null }),
    });
  });

  it("lança erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    await expect(excluirCatalogoExame("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockDeleteCatalogoExame).not.toHaveBeenCalled();
  });

  it("lança erro quando id não é UUID válido", async () => {
    await expect(excluirCatalogoExame("invalid")).rejects.toThrow("ID inválido.");
  });

  it("lança erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    await expect(excluirCatalogoExame("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Sem permissão.");
  });

  it("lança erro quando papel não é superadmin", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "gestor", userId: "00000000-0000-0000-0000-000000000002",
    });
    await expect(excluirCatalogoExame("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Sem permissão.");
  });

  it("exclui exame com sucesso", async () => {
    await excluirCatalogoExame("00000000-0000-0000-0000-000000000010");
    expect(mockDeleteCatalogoExame).toHaveBeenCalled();
  });

  it("lança erro quando delete falha", async () => {
    mockDeleteCatalogoExame.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({ error: { message: "FK constraint" } }),
    });
    await expect(excluirCatalogoExame("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Erro ao excluir exame");
  });
});

// ============================================
// criarMedicamento
// ============================================

describe("criarMedicamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClinicaAtual).mockResolvedValue({
      clinicaId: "00000000-0000-0000-0000-000000000001",
      clinicaNome: "Clínica Teste",
      papel: "superadmin",
      userId: "00000000-0000-0000-0000-000000000002",
    });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await criarMedicamento({}, makeFormData({ nome: "Amoxicilina" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockInsertMedicamento).not.toHaveBeenCalled();
  });

  it("retorna erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await criarMedicamento({}, makeFormData({ nome: "Amoxicilina" }));
    expect(result.error).toBe("Sem permissão.");
  });

  it("retorna erro quando papel não é superadmin", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "gestor", userId: "00000000-0000-0000-0000-000000000002",
    });
    const result = await criarMedicamento({}, makeFormData({ nome: "Amoxicilina" }));
    expect(result.error).toBe("Sem permissão.");
  });

  it("retorna erro quando nome está vazio", async () => {
    const result = await criarMedicamento({}, makeFormData({ nome: "" }));
    expect(result.error).toBe("Nome é obrigatório.");
  });

  it("retorna erro quando nome excede 255 caracteres", async () => {
    const longName = "a".repeat(256);
    const result = await criarMedicamento({}, makeFormData({ nome: longName }));
    expect(result.error).toBe("Nome excede 255 caracteres.");
  });

  it("retorna erro quando posologia excede 500 caracteres", async () => {
    const longPosologia = "a".repeat(501);
    const result = await criarMedicamento({}, makeFormData({ nome: "Amoxicilina", posologia: longPosologia }));
    expect(result.error).toBe("Posologia excede 500 caracteres.");
  });

  it("retorna erro quando quantidade excede 100 caracteres", async () => {
    const longQtd = "a".repeat(101);
    const result = await criarMedicamento({}, makeFormData({ nome: "Amoxicilina", quantidade: longQtd }));
    expect(result.error).toBe("Quantidade excede 100 caracteres.");
  });

  it("retorna erro quando via excede 100 caracteres", async () => {
    const longVia = "a".repeat(101);
    const result = await criarMedicamento({}, makeFormData({ nome: "Amoxicilina", via_administracao: longVia }));
    expect(result.error).toBe("Via excede 100 caracteres.");
  });

  it("cria medicamento com sucesso (todos os campos)", async () => {
    const result = await criarMedicamento({}, makeFormData({
      nome: "Amoxicilina",
      posologia: "500mg 8/8h",
      quantidade: "21 comprimidos",
      via_administracao: "Oral",
    }));
    expect(result.success).toBe(true);
    expect(mockInsertMedicamento).toHaveBeenCalledWith({
      nome: "Amoxicilina",
      posologia: "500mg 8/8h",
      quantidade: "21 comprimidos",
      via_administracao: "Oral",
    });
  });

  it("cria medicamento com campos opcionais null", async () => {
    const result = await criarMedicamento({}, makeFormData({ nome: "Amoxicilina" }));
    expect(result.success).toBe(true);
    expect(mockInsertMedicamento).toHaveBeenCalledWith({
      nome: "Amoxicilina",
      posologia: null,
      quantidade: null,
      via_administracao: null,
    });
  });

  it("retorna erro quando insert falha", async () => {
    mockInsertMedicamento.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await criarMedicamento({}, makeFormData({ nome: "Amoxicilina" }));
    expect(result.error).toContain("Erro ao criar medicamento");
  });
});

// ============================================
// atualizarMedicamento
// ============================================

describe("atualizarMedicamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClinicaAtual).mockResolvedValue({
      clinicaId: "00000000-0000-0000-0000-000000000001",
      clinicaNome: "Clínica Teste",
      papel: "superadmin",
      userId: "00000000-0000-0000-0000-000000000002",
    });
    mockUpdateMedicamento.mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: null }),
    });
  });

  it("retorna erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: "Amoxicilina" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockUpdateMedicamento).not.toHaveBeenCalled();
  });

  it("retorna erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: "Amoxicilina" }));
    expect(result.error).toBe("Sem permissão.");
  });

  it("retorna erro quando papel não é superadmin", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "profissional_saude", userId: "00000000-0000-0000-0000-000000000002",
    });
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: "Amoxicilina" }));
    expect(result.error).toBe("Sem permissão.");
  });

  it("retorna erro quando id não é UUID válido", async () => {
    const result = await atualizarMedicamento({}, makeFormData({ id: "invalid", nome: "Amoxicilina" }));
    expect(result.error).toBe("Medicamento não identificado.");
  });

  it("retorna erro quando nome está vazio", async () => {
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: "" }));
    expect(result.error).toBe("Nome é obrigatório.");
  });

  it("retorna erro quando nome excede 255 caracteres", async () => {
    const longName = "a".repeat(256);
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: longName }));
    expect(result.error).toBe("Nome excede 255 caracteres.");
  });

  it("retorna erro quando posologia excede 500 caracteres", async () => {
    const longPosologia = "a".repeat(501);
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: "Med", posologia: longPosologia }));
    expect(result.error).toBe("Posologia excede 500 caracteres.");
  });

  it("retorna erro quando quantidade excede 100 caracteres", async () => {
    const longQtd = "a".repeat(101);
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: "Med", quantidade: longQtd }));
    expect(result.error).toBe("Quantidade excede 100 caracteres.");
  });

  it("retorna erro quando via excede 100 caracteres", async () => {
    const longVia = "a".repeat(101);
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: "Med", via_administracao: longVia }));
    expect(result.error).toBe("Via excede 100 caracteres.");
  });

  it("atualiza medicamento com sucesso", async () => {
    const result = await atualizarMedicamento({}, makeFormData({
      id: "00000000-0000-0000-0000-000000000020",
      nome: "Amoxicilina 500mg",
      posologia: "8/8h por 7 dias",
      quantidade: "21 comp",
      via_administracao: "Oral",
    }));
    expect(result.success).toBe(true);
    expect(mockUpdateMedicamento).toHaveBeenCalledWith({
      nome: "Amoxicilina 500mg",
      posologia: "8/8h por 7 dias",
      quantidade: "21 comp",
      via_administracao: "Oral",
    });
  });

  it("retorna erro quando update falha", async () => {
    mockUpdateMedicamento.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({ error: { message: "DB error" } }),
    });
    const result = await atualizarMedicamento({}, makeFormData({ id: "00000000-0000-0000-0000-000000000020", nome: "Amoxicilina" }));
    expect(result.error).toContain("Erro ao atualizar medicamento");
  });
});

// ============================================
// excluirMedicamento
// ============================================

describe("excluirMedicamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClinicaAtual).mockResolvedValue({
      clinicaId: "00000000-0000-0000-0000-000000000001",
      clinicaNome: "Clínica Teste",
      papel: "superadmin",
      userId: "00000000-0000-0000-0000-000000000002",
    });
    mockDeleteMedicamento.mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: null }),
    });
  });

  it("lança erro quando rate limit é excedido", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 900000 });
    await expect(excluirMedicamento("00000000-0000-0000-0000-000000000020")).rejects.toThrow("Muitas tentativas. Aguarde antes de tentar novamente.");
    expect(mockDeleteMedicamento).not.toHaveBeenCalled();
  });

  it("lança erro quando id não é UUID válido", async () => {
    await expect(excluirMedicamento("invalid")).rejects.toThrow("ID inválido.");
  });

  it("lança erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    await expect(excluirMedicamento("00000000-0000-0000-0000-000000000020")).rejects.toThrow("Sem permissão.");
  });

  it("lança erro quando papel não é superadmin", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "gestor", userId: "00000000-0000-0000-0000-000000000002",
    });
    await expect(excluirMedicamento("00000000-0000-0000-0000-000000000020")).rejects.toThrow("Sem permissão.");
  });

  it("exclui medicamento com sucesso", async () => {
    await excluirMedicamento("00000000-0000-0000-0000-000000000020");
    expect(mockDeleteMedicamento).toHaveBeenCalled();
  });

  it("lança erro quando delete falha", async () => {
    mockDeleteMedicamento.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({ error: { message: "FK constraint" } }),
    });
    await expect(excluirMedicamento("00000000-0000-0000-0000-000000000020")).rejects.toThrow("Erro ao excluir medicamento");
  });
});
