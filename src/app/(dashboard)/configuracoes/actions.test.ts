import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsert = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        upsert: (rows: unknown, opts: unknown) => {
          mockUpsert(rows, opts);
          return Promise.resolve({ error: null });
        },
      }),
      auth: {
        updateUser: (data: unknown) => {
          mockUpdateUser(data);
          return Promise.resolve({ error: null });
        },
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
});
