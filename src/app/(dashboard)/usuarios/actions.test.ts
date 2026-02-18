import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockResolvedValue({ error: null });

// Chainable .eq() for update: .update(data).eq().eq() → { error: null }
const mockUpdateChain: Record<string, unknown> = { error: null };
const mockUpdateEq = vi.fn().mockReturnValue(mockUpdateChain);
mockUpdateChain.eq = mockUpdateEq;
const mockUpdate = vi.fn().mockReturnValue(mockUpdateChain);

// Chainable .eq() for delete: .delete().eq().eq() → { error: null }
const mockDeleteChain: Record<string, unknown> = { error: null };
const mockDeleteEq = vi.fn().mockReturnValue(mockDeleteChain);
mockDeleteChain.eq = mockDeleteEq;
const mockDelete = vi.fn().mockReturnValue(mockDeleteChain);

// Chainable .eq() for select: .select().eq().eq().single() or .select().eq().in().neq()
const mockSelectSingle = vi.fn().mockResolvedValue({
  data: { user_id: "00000000-0000-0000-0000-000000000020", papel: "secretaria" },
  error: null,
});
const mockCountResult = vi.fn().mockResolvedValue({ count: 2, data: null, error: null });
const mockSelectChain: Record<string, unknown> = { single: () => mockSelectSingle() };
const mockSelectEq = vi.fn().mockReturnValue(mockSelectChain);
mockSelectChain.eq = mockSelectEq;
mockSelectChain.in = vi.fn().mockReturnValue(mockSelectChain);
mockSelectChain.neq = mockCountResult;

const mockAdminCreateUser = vi.fn().mockResolvedValue({
  data: { user: { id: "00000000-0000-0000-0000-000000000040" } },
  error: null,
});
const mockAdminListUsers = vi.fn().mockResolvedValue({
  data: { users: [{ id: "00000000-0000-0000-0000-000000000050", email: "dup@test.com" }] },
});
const mockAdminUpdateUser = vi.fn().mockResolvedValue({ error: null });
const mockAdminDeleteUser = vi.fn().mockResolvedValue({ error: null });

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        insert: (rows: unknown) => mockInsert(rows),
        update: (data: unknown) => mockUpdate(data),
        delete: () => mockDelete(),
        select: () => ({ eq: mockSelectEq }),
      }),
    }),
}));

const mockGetUserIdByEmail = vi.fn().mockResolvedValue("00000000-0000-0000-0000-000000000050");

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: (rows: unknown) => mockInsert(rows),
      update: (data: unknown) => mockUpdate(data),
      delete: () => mockDelete(),
      select: () => ({ eq: mockSelectEq }),
    }),
    auth: {
      admin: {
        createUser: (data: unknown) => mockAdminCreateUser(data),
        listUsers: (opts: unknown) => mockAdminListUsers(opts),
        updateUserById: (id: string, data: unknown) => mockAdminUpdateUser(id, data),
        deleteUser: (id: string) => mockAdminDeleteUser(id),
      },
    },
  }),
  getUserIdByEmail: (...args: unknown[]) => mockGetUserIdByEmail(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 4, resetIn: 3600000 }),
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
  isGestor: (papel: string) => papel === "superadmin" || papel === "gestor",
}));

import { criarUsuario, atualizarUsuario, resetarSenha, removerVinculo } from "./actions";
import { getClinicaAtual } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

function chainableError(error: unknown) {
  const r: Record<string, unknown> = { error };
  r.eq = vi.fn().mockReturnValue(r);
  return r;
}

describe("criarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-0000-0000-000000000040" } },
      error: null,
    });
  });

  it("retorna erro quando email está vazio", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "", senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("E-mail é obrigatório.");
  });

  it("retorna erro quando email é inválido", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "invalido", senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("E-mail inválido.");
  });

  it("retorna erro quando email excede max length", async () => {
    const longEmail = "a".repeat(250) + "@b.co";
    const result = await criarUsuario({}, makeFormData({ email: longEmail, senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("E-mail excede 254 caracteres.");
  });

  it("retorna erro quando senha é curta", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("A senha deve ter pelo menos 6 caracteres.");
  });

  it("retorna erro quando senha excede max length", async () => {
    const longPass = "a".repeat(129);
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: longPass, papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("A senha deve ter no máximo 128 caracteres.");
  });

  it("retorna erro quando papel é inválido", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "invalido", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("Papel inválido.");
  });

  it("retorna erro quando papel é superadmin", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "superadmin", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("Papel inválido.");
  });

  it("retorna erro quando clinica_id está vazio", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "" }));
    expect(result.error).toBe("Selecione uma clínica.");
  });

  it("retorna erro quando não tem permissão (secretaria)", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000011",
    });
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("Sem permissão para criar usuários.");
  });

  it("retorna erro quando clinicaId não pertence ao usuário", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000099" }));
    expect(result.error).toBe("Você não tem acesso a esta clínica.");
  });

  it("vincula usuário existente quando email já existe no Auth", async () => {
    mockAdminCreateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "A user with this email address has already been registered" },
    });
    const result = await criarUsuario({}, makeFormData({ email: "dup@test.com", senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "00000000-0000-0000-0000-000000000050",
      clinica_id: "00000000-0000-0000-0000-000000000001",
      papel: "secretaria",
    });
  });

  it("retorna erro genérico quando createUser falha", async () => {
    mockAdminCreateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Unknown error" },
    });
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("Erro ao criar usuário. Tente novamente.");
  });

  it("cria usuário com sucesso", async () => {
    const result = await criarUsuario({}, makeFormData({ email: "novo@test.com", senha: "senhaSegura", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.success).toBe(true);
    expect(mockAdminCreateUser).toHaveBeenCalledWith({
      email: "novo@test.com",
      password: "senhaSegura",
      email_confirm: true,
    });
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "00000000-0000-0000-0000-000000000040",
      clinica_id: "00000000-0000-0000-0000-000000000001",
      papel: "secretaria",
    });
  });

  it("permite superadmin criar usuários", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "superadmin", userId: "00000000-0000-0000-0000-000000000011",
    });
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.success).toBe(true);
  });

  it("retorna erro quando vínculo duplicado (23505)", async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: "23505", message: "duplicate" } });
    const result = await criarUsuario({}, makeFormData({ email: "user@test.com", senha: "123456", papel: "secretaria", clinica_id: "00000000-0000-0000-0000-000000000001" }));
    expect(result.error).toBe("Este usuário já está vinculado a esta clínica.");
  });
});

describe("atualizarUsuario", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando vinculo_id está vazio", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "", user_id: "00000000-0000-0000-0000-000000000011", papel: "secretaria" }));
    expect(result.error).toBe("Vínculo não identificado.");
  });

  it("retorna erro quando papel é inválido", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000011", papel: "invalido" }));
    expect(result.error).toBe("Papel inválido.");
  });

  it("retorna erro quando não tem permissão", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000011",
    });
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000012", papel: "gestor" }));
    expect(result.error).toBe("Sem permissão para editar usuários.");
  });

  it("impede auto-edição", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000002", papel: "secretaria" }));
    expect(result.error).toBe("Você não pode editar seu próprio vínculo.");
  });

  it("atualiza usuário com sucesso", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000020", papel: "gestor" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ papel: "gestor" });
  });

  it("filtra update por clinica_id (previne IDOR)", async () => {
    await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000020", papel: "gestor" }));
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000010");
    expect(mockUpdateEq).toHaveBeenCalledWith("clinica_id", "00000000-0000-0000-0000-000000000001");
  });

  it("retorna erro quando update falha", async () => {
    mockUpdate.mockReturnValueOnce(chainableError({ message: "DB error" }));
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000020", papel: "gestor" }));
    expect(result.error).toContain("Erro ao atualizar usuário");
  });

  it("impede rebaixar o último gestor da clínica", async () => {
    mockCountResult.mockResolvedValueOnce({ count: 0, data: null, error: null });
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000020", papel: "secretaria" }));
    expect(result.error).toBe("A clínica deve ter pelo menos um gestor.");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("permite rebaixar quando há outros gestores", async () => {
    mockCountResult.mockResolvedValueOnce({ count: 1, data: null, error: null });
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000020", papel: "secretaria" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ papel: "secretaria" });
  });

  it("não verifica último gestor quando novo papel é gestor", async () => {
    const result = await atualizarUsuario({}, makeFormData({ vinculo_id: "00000000-0000-0000-0000-000000000010", user_id: "00000000-0000-0000-0000-000000000020", papel: "gestor" }));
    expect(result.success).toBe(true);
    expect(mockCountResult).not.toHaveBeenCalled();
  });
});

describe("resetarSenha", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna erro quando user_id está vazio", async () => {
    const result = await resetarSenha({}, makeFormData({ user_id: "", senha: "123456" }));
    expect(result.error).toBe("Usuário não identificado.");
  });

  it("retorna erro quando senha é curta", async () => {
    const result = await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000011", senha: "123" }));
    expect(result.error).toBe("A senha deve ter pelo menos 6 caracteres.");
  });

  it("retorna erro quando senha excede max length", async () => {
    const longPass = "a".repeat(129);
    const result = await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000011", senha: longPass }));
    expect(result.error).toBe("A senha deve ter no máximo 128 caracteres.");
  });

  it("retorna erro quando não tem permissão", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000011",
    });
    const result = await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000012", senha: "123456" }));
    expect(result.error).toBe("Sem permissão para resetar senhas.");
  });

  it("impede auto-reset", async () => {
    const result = await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000002", senha: "123456" }));
    expect(result.error).toBe("Use a aba Conta nas Configurações para alterar sua própria senha.");
  });

  it("retorna erro quando usuário não pertence à clínica (previne IDOR)", async () => {
    mockSelectSingle.mockResolvedValueOnce({ data: null, error: null });
    const result = await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000030", senha: "123456" }));
    expect(result.error).toBe("Usuário não encontrado nesta clínica.");
    expect(mockAdminUpdateUser).not.toHaveBeenCalled();
  });

  it("verifica clinica_id ao buscar vínculo do usuário", async () => {
    await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000020", senha: "novaSenha123" }));
    expect(mockSelectEq).toHaveBeenCalledWith("user_id", "00000000-0000-0000-0000-000000000020");
    expect(mockSelectEq).toHaveBeenCalledWith("clinica_id", "00000000-0000-0000-0000-000000000001");
  });

  it("reseta senha com sucesso", async () => {
    const result = await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000020", senha: "novaSenha123" }));
    expect(result.success).toBe(true);
    expect(mockAdminUpdateUser).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000020", { password: "novaSenha123" });
  });

  it("retorna erro quando rate limit é atingido", async () => {
    vi.mocked(rateLimit).mockReturnValueOnce({ success: false, remaining: 0, resetIn: 3600000 });
    const result = await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000020", senha: "123456" }));
    expect(result.error).toBe("Muitas tentativas. Aguarde 1 hora antes de tentar novamente.");
  });

  it("retorna erro quando admin API falha", async () => {
    mockAdminUpdateUser.mockResolvedValueOnce({ error: { message: "API error" } });
    const result = await resetarSenha({}, makeFormData({ user_id: "00000000-0000-0000-0000-000000000020", senha: "123456" }));
    expect(result.error).toBe("Erro ao resetar senha. Tente novamente.");
  });
});

describe("removerVinculo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectSingle.mockResolvedValue({
      data: { user_id: "00000000-0000-0000-0000-000000000020", papel: "secretaria" },
      error: null,
    });
    mockCountResult.mockResolvedValue({ count: 2, data: null, error: null });
  });

  it("lança erro quando vinculoId está vazio", async () => {
    await expect(removerVinculo("")).rejects.toThrow("Vínculo não identificado.");
  });

  it("lança erro quando não tem permissão", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce({
      clinicaId: "00000000-0000-0000-0000-000000000001", clinicaNome: "Teste", papel: "secretaria", userId: "00000000-0000-0000-0000-000000000011",
    });
    await expect(removerVinculo("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Sem permissão para remover vínculos.");
  });

  it("lança erro quando vínculo não pertence à clínica (previne IDOR)", async () => {
    mockSelectSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(removerVinculo("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Vínculo não encontrado nesta clínica.");
  });

  it("filtra select e delete por clinica_id", async () => {
    await removerVinculo("00000000-0000-0000-0000-000000000010");
    expect(mockSelectEq).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000010");
    expect(mockSelectEq).toHaveBeenCalledWith("clinica_id", "00000000-0000-0000-0000-000000000001");
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000010");
    expect(mockDeleteEq).toHaveBeenCalledWith("clinica_id", "00000000-0000-0000-0000-000000000001");
  });

  it("impede auto-remoção", async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: { user_id: "00000000-0000-0000-0000-000000000002", papel: "gestor" },
      error: null,
    });
    await expect(removerVinculo("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Você não pode remover seu próprio vínculo.");
  });

  it("remove vínculo com sucesso", async () => {
    await removerVinculo("00000000-0000-0000-0000-000000000010");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("lança erro quando delete falha", async () => {
    mockDelete.mockReturnValueOnce(chainableError({ message: "FK constraint" }));
    await expect(removerVinculo("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Erro ao excluir vínculo");
  });

  it("impede remover o último gestor da clínica", async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: { user_id: "00000000-0000-0000-0000-000000000020", papel: "gestor" },
      error: null,
    });
    mockCountResult.mockResolvedValueOnce({ count: 0, data: null, error: null });
    await expect(removerVinculo("00000000-0000-0000-0000-000000000010")).rejects.toThrow("Não é possível remover o último gestor da clínica.");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("permite remover gestor quando há outros", async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: { user_id: "00000000-0000-0000-0000-000000000020", papel: "gestor" },
      error: null,
    });
    mockCountResult.mockResolvedValueOnce({ count: 1, data: null, error: null });
    await removerVinculo("00000000-0000-0000-0000-000000000010");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("não verifica último gestor ao remover não-gestor", async () => {
    await removerVinculo("00000000-0000-0000-0000-000000000010");
    expect(mockCountResult).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
  });
});
