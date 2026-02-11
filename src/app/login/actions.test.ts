import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockRedirect = vi.fn();
const mockRevalidatePath = vi.fn();

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

import { login, logout } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona para / em caso de sucesso", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await expect(
      login(makeFormData({ email: "doc@test.com", password: "123456" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "doc@test.com",
      password: "123456",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redireciona para /login?error em caso de erro", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid" } });
    await expect(
      login(makeFormData({ email: "doc@test.com", password: "wrong" }))
    ).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login?error=Credenciais+inválidas");
  });
});

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama signOut e redireciona para /login", async () => {
    mockSignOut.mockResolvedValue({});
    await expect(logout()).rejects.toThrow("REDIRECT");
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
