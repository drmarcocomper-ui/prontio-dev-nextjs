import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        upsert: (rows: unknown, opts: unknown) => mockUpsert(rows, opts),
      }),
      auth: {
        updateUser: (data: unknown) => mockUpdateUser(data),
      },
    }),
}));

import { salvarConfiguracoes, alterarSenha } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("salvarConfiguracoes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando nome_consultorio está vazio", async () => {
    const result = await salvarConfiguracoes({}, makeFormData({ config_nome_consultorio: "" }));
    expect(result.error).toBe("Nome do consultório é obrigatório.");
  });

  it("salva configurações com sucesso", async () => {
    const result = await salvarConfiguracoes({}, makeFormData({
      config_nome_consultorio: "Clínica Teste",
      config_cnpj: "12345678000100",
    }));
    expect(result.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        { chave: "nome_consultorio", valor: "Clínica Teste" },
        { chave: "cnpj", valor: "12345678000100" },
      ]),
      { onConflict: "chave" }
    );
  });

  it("ignora campos que não começam com config_", async () => {
    const result = await salvarConfiguracoes({}, makeFormData({
      config_nome_consultorio: "Clínica",
      outro_campo: "valor",
    }));
    expect(result.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      [{ chave: "nome_consultorio", valor: "Clínica" }],
      { onConflict: "chave" }
    );
  });

  it("retorna erro quando campo excede max length", async () => {
    const longName = "a".repeat(256);
    const result = await salvarConfiguracoes({}, makeFormData({
      config_nome_consultorio: longName,
    }));
    expect(result.error).toBe("Campo excede o limite de 255 caracteres.");
  });

  it("retorna erro quando upsert falha", async () => {
    mockUpsert.mockResolvedValueOnce({ error: { message: "DB error" } });
    const result = await salvarConfiguracoes({}, makeFormData({
      config_nome_consultorio: "Clínica",
    }));
    expect(result.error).toBe("Erro ao salvar configurações. Tente novamente.");
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
