import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      },
    }),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: string) => ({ type: "redirect", url: String(url) }),
  },
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("troca código por sessão e redireciona para /", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const request = new Request("http://localhost:3000/auth/callback?code=abc123");
    const response = await GET(request);
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response).toEqual(expect.objectContaining({
      type: "redirect",
      url: expect.stringContaining("/"),
    }));
  });

  it("redireciona para next quando fornecido", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const request = new Request("http://localhost:3000/auth/callback?code=abc123&next=/pacientes");
    const response = await GET(request);
    expect(response.url).toContain("/pacientes");
  });

  it("redireciona para /login?error=auth_erro quando não tem código", async () => {
    const request = new Request("http://localhost:3000/auth/callback");
    const response = await GET(request);
    expect(response.url).toContain("/login?error=auth_erro");
  });

  it("redireciona para /login?error=auth_erro quando exchange falha", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: "invalid" } });
    const request = new Request("http://localhost:3000/auth/callback?code=bad");
    const response = await GET(request);
    expect(response.url).toContain("/login?error=auth_erro");
  });

  it("bloqueia open redirect com //", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const request = new Request("http://localhost:3000/auth/callback?code=abc123&next=//evil.com");
    const response = await GET(request);
    expect(response.url).not.toContain("evil.com");
    expect(response.url).toMatch(/localhost:3000\/$/);
  });

  it("bloqueia open redirect com URL absoluta", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const request = new Request("http://localhost:3000/auth/callback?code=abc123&next=https://evil.com");
    const response = await GET(request);
    expect(response.url).not.toContain("evil.com");
    expect(response.url).toMatch(/localhost:3000\/$/);
  });
});
