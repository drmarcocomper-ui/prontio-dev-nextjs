import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockRedirect = vi.fn();
const mockRevalidatePath = vi.fn();
const mockRateLimit = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signOut: mockSignOut,
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

import { login, logout } from "./actions";

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
