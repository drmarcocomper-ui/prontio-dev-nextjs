import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdate = vi.fn().mockReturnValue({ error: null });
const mockEq = vi.fn().mockReturnValue({ error: null });
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ error: null }) }) });
const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "clinicas") {
          return {
            update: (data: unknown) => {
              mockUpdate(data);
              return { eq: (col: string, val: string) => { mockEq(col, val); return { error: null }; } };
            },
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

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinica-123",
    clinicaNome: "Clínica Teste",
    papel: "medico",
    userId: "user-456",
  }),
  getMedicoId: vi.fn().mockResolvedValue("user-456"),
}));

import { salvarConsultorio, salvarHorarios, salvarProfissional, alterarSenha, convidarSecretaria } from "./actions";
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

describe("convidarSecretaria", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando email está vazio", async () => {
    const result = await convidarSecretaria({}, makeFormData({ email: "", clinica_id: "clinica-123" }));
    expect(result.error).toBe("E-mail é obrigatório.");
  });

  it("retorna erro quando email é inválido", async () => {
    const result = await convidarSecretaria({}, makeFormData({ email: "invalido", clinica_id: "clinica-123" }));
    expect(result.error).toBe("E-mail inválido.");
  });

  it("retorna erro quando clinica_id está vazio", async () => {
    const result = await convidarSecretaria({}, makeFormData({ email: "sec@email.com", clinica_id: "" }));
    expect(result.error).toBe("Selecione uma clínica.");
  });
});
