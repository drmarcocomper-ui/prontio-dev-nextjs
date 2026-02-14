import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ error: null }),
});
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ error: null }),
});
const mockSelectSingle = vi.fn().mockResolvedValue({
  data: { user_id: "other-user" },
  error: null,
});
const mockAdminCreateUser = vi.fn().mockResolvedValue({
  data: { user: { id: "new-user-id" } },
  error: null,
});
const mockAdminUpdateUser = vi.fn().mockResolvedValue({ error: null });

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (rows: unknown) => mockInsert(rows),
        update: (data: unknown) => mockUpdate(data),
        delete: () => mockDelete(),
        select: () => ({
          eq: () => ({
            single: () => mockSelectSingle(),
          }),
        }),
      }),
    }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        createUser: (data: unknown) => mockAdminCreateUser(data),
        updateUserById: (id: string, data: unknown) => mockAdminUpdateUser(id, data),
      },
    },
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 4, resetIn: 3600000 }),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinica-123",
    clinicaNome: "Clínica Teste",
    papel: "gestor",
    userId: "user-456",
  }),
  getClinicasDoUsuario: vi.fn().mockResolvedValue([
    { id: "clinica-123", nome: "Clínica Teste", papel: "gestor" },
  ]),
  isGestor: (papel: string) => papel === "superadmin" || papel === "gestor",
}));

import { criarUsuario, atualizarUsuario, atualizarPapel, resetarSenha, removerVinculo } from "./actions";
import { getClinicaAtual, getClinicasDoUsuario } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

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
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "invalido", clinica_id: "clinica-123" }));
    expect(result.error).toBe("Papel inválido.");
  });

  it("retorna erro quando papel é superadmin", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "superadmin", clinica_id: "clinica-123" }));
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

  it("retorna erro quando clinicaId não pertence ao usuário", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "outra-clinica" }));
    expect(result.error).toBe("Você não tem acesso a esta clínica.");
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

  it("permite superadmin criar usuários", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinica-123", clinicaNome: "Teste", papel: "superadmin", userId: "u-1",
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

describe("atualizarUsuario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando vinculo_id está vazio", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "", user_id: "u-1", papel: "secretaria" }));
    expect(result.error).toBe("Vínculo não identificado.");
  });

  it("retorna erro quando papel é inválido", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "v-1", user_id: "u-1", papel: "invalido" }));
    expect(result.error).toBe("Papel inválido.");
  });

  it("retorna erro quando não tem permissão", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinica-123", clinicaNome: "Teste", papel: "secretaria", userId: "u-1",
    });
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "v-1", user_id: "u-2", papel: "gestor" }));
    expect(result.error).toBe("Sem permissão para editar usuários.");
  });

  it("impede auto-edição", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "v-1", user_id: "user-456", papel: "secretaria" }));
    expect(result.error).toBe("Você não pode editar seu próprio vínculo.");
  });

  it("atualiza usuário com sucesso", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "v-1", user_id: "other-user", papel: "gestor" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ papel: "gestor" });
  });

  it("retorna erro quando update falha", async () => {
    mockUpdate.mockReturnValueOnce({ eq: () => ({ error: { message: "DB error" } }) });
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "v-1", user_id: "other-user", papel: "gestor" }));
    expect(result.error).toContain("Erro ao atualizar usuário");
  });
});

describe("atualizarPapel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando vinculo_id está vazio", async () => {
    const result = await atualizarPapel({}, makeFormData({ vinculo_id: "", user_id: "u-1", papel: "secretaria" }));
    expect(result.error).toBe("Vínculo não identificado.");
  });

  it("retorna erro quando papel é inválido", async () => {
    const result = await atualizarPapel({}, makeFormData({ vinculo_id: "v-1", user_id: "u-1", papel: "invalido" }));
    expect(result.error).toBe("Papel inválido.");
  });

  it("retorna erro quando não tem permissão", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinica-123", clinicaNome: "Teste", papel: "secretaria", userId: "u-1",
    });
    const result = await atualizarPapel({}, makeFormData({ vinculo_id: "v-1", user_id: "u-2", papel: "gestor" }));
    expect(result.error).toBe("Sem permissão para alterar papéis.");
  });

  it("impede auto-alteração", async () => {
    const result = await atualizarPapel({}, makeFormData({ vinculo_id: "v-1", user_id: "user-456", papel: "secretaria" }));
    expect(result.error).toBe("Você não pode alterar seu próprio papel.");
  });

  it("atualiza papel com sucesso", async () => {
    const result = await atualizarPapel({}, makeFormData({ vinculo_id: "v-1", user_id: "other-user", papel: "gestor" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ papel: "gestor" });
  });

  it("retorna erro quando update falha", async () => {
    mockUpdate.mockReturnValueOnce({ eq: () => ({ error: { message: "DB error" } }) });
    const result = await atualizarPapel({}, makeFormData({ vinculo_id: "v-1", user_id: "other-user", papel: "gestor" }));
    expect(result.error).toContain("Erro ao atualizar papel");
  });
});

describe("resetarSenha", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando user_id está vazio", async () => {
    const result = await resetarSenha({}, makeFormData({ user_id: "", senha: "123456" }));
    expect(result.error).toBe("Usuário não identificado.");
  });

  it("retorna erro quando senha é curta", async () => {
    const result = await resetarSenha({}, makeFormData({ user_id: "u-1", senha: "123" }));
    expect(result.error).toBe("A senha deve ter pelo menos 6 caracteres.");
  });

  it("retorna erro quando senha excede max length", async () => {
    const longPass = "a".repeat(129);
    const result = await resetarSenha({}, makeFormData({ user_id: "u-1", senha: longPass }));
    expect(result.error).toBe("A senha deve ter no máximo 128 caracteres.");
  });

  it("retorna erro quando não tem permissão", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinica-123", clinicaNome: "Teste", papel: "secretaria", userId: "u-1",
    });
    const result = await resetarSenha({}, makeFormData({ user_id: "u-2", senha: "123456" }));
    expect(result.error).toBe("Sem permissão para resetar senhas.");
  });

  it("impede auto-reset", async () => {
    const result = await resetarSenha({}, makeFormData({ user_id: "user-456", senha: "123456" }));
    expect(result.error).toBe("Use a aba Conta nas Configurações para alterar sua própria senha.");
  });

  it("reseta senha com sucesso", async () => {
    const result = await resetarSenha({}, makeFormData({ user_id: "other-user", senha: "novaSenha123" }));
    expect(result.success).toBe(true);
    expect(mockAdminUpdateUser).toHaveBeenCalledWith("other-user", { password: "novaSenha123" });
  });

  it("retorna erro quando rate limit é atingido", async () => {
    vi.mocked(rateLimit).mockReturnValueOnce({ success: false, remaining: 0, resetIn: 3600000 });
    const result = await resetarSenha({}, makeFormData({ user_id: "other-user", senha: "123456" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde 1 hora antes de tentar novamente.");
  });

  it("retorna erro quando admin API falha", async () => {
    mockAdminUpdateUser.mockResolvedValueOnce({ error: { message: "API error" } });
    const result = await resetarSenha({}, makeFormData({ user_id: "other-user", senha: "123456" }));
    expect(result.error).toBe("Erro ao resetar senha. Tente novamente.");
  });
});

describe("removerVinculo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectSingle.mockResolvedValue({
      data: { user_id: "other-user" },
      error: null,
    });
  });

  it("lança erro quando vinculoId está vazio", async () => {
    await expect(removerVinculo("")).rejects.toThrow("Vínculo não identificado.");
  });

  it("lança erro quando não tem permissão", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "clinica-123", clinicaNome: "Teste", papel: "secretaria", userId: "u-1",
    });
    await expect(removerVinculo("v-1")).rejects.toThrow("Sem permissão para remover vínculos.");
  });

  it("impede auto-remoção", async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: { user_id: "user-456" },
      error: null,
    });
    await expect(removerVinculo("v-1")).rejects.toThrow("Você não pode remover seu próprio vínculo.");
  });

  it("remove vínculo com sucesso", async () => {
    await removerVinculo("v-1");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("lança erro quando delete falha", async () => {
    mockDelete.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({ error: { message: "FK constraint" } }),
    });
    await expect(removerVinculo("v-1")).rejects.toThrow("Erro ao excluir vínculo");
  });
});
