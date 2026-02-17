import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockResetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
const mockRedirect = vi.fn();
const mockRevalidatePath = vi.fn();
const mockRateLimit = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signOut: mockSignOut,
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    }),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT");
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve(new Map([["x-forwarded-for", "127.0.0.1"]])),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

import { login, logout, enviarResetSenha } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockReturnValue({ success: true, remaining: 4, resetIn: 900000 });
  });

  it("redireciona para / em caso de sucesso", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await expect(
      login({}, makeFormData({ email: "doc@test.com", password: "123456" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "doc@test.com",
      password: "123456",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("retorna erro no state em caso de falha", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid" } });
    const result = await login(
      {},
      makeFormData({ email: "doc@test.com", password: "wrong" })
    );
    expect(result).toEqual({ error: "E-mail ou senha incorretos." });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("bloqueia login quando rate limit é excedido", async () => {
    mockRateLimit.mockReturnValue({ success: false, remaining: 0, resetIn: 600000 });
    const result = await login(
      {},
      makeFormData({ email: "doc@test.com", password: "123456" })
    );
    expect(result.error).toMatch(/Muitas tentativas de login/);
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama signOut, revalidatePath e redireciona para /login", async () => {
    mockSignOut.mockResolvedValue({});
    await expect(logout()).rejects.toThrow("REDIRECT");
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});

describe("enviarResetSenha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockReturnValue({ success: true, remaining: 2, resetIn: 900000 });
  });

  it("retorna erro quando email está vazio", async () => {
    const result = await enviarResetSenha({}, makeFormData({ email: "" }));
    expect(result.error).toBe("Informe seu e-mail.");
  });

  it("retorna success quando rate limit é atingido (não revela)", async () => {
    mockRateLimit.mockReturnValue({ success: false, remaining: 0, resetIn: 900000 });
    const result = await enviarResetSenha({}, makeFormData({ email: "test@test.com" }));
    expect(result.success).toBe(true);
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("chama rateLimit com chave baseada no email", async () => {
    await enviarResetSenha({}, makeFormData({ email: "Test@Example.com" }));
    expect(mockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "reset:test@example.com",
        maxAttempts: 3,
      })
    );
  });

  it("envia email de reset com sucesso", async () => {
    const result = await enviarResetSenha({}, makeFormData({ email: "test@test.com" }));
    expect(result.success).toBe(true);
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "test@test.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/auth/callback") })
    );
  });

  it("retorna success mesmo quando Supabase retorna erro (não revela)", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: "User not found" } });
    const result = await enviarResetSenha({}, makeFormData({ email: "unknown@test.com" }));
    expect(result.success).toBe(true);
  });
});
