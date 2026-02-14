import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();

let mockVinculoResult: { data: { clinica_id?: string; papel?: string } | null } = { data: null };

// Capture the cookies config passed to createServerClient
let capturedCookiesConfig: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
} | null = null;

function createFromChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockImplementation(() => Promise.resolve(mockVinculoResult));
  return chain;
}

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, config: { cookies: typeof capturedCookiesConfig }) => {
    capturedCookiesConfig = config.cookies;
    return {
      auth: { getUser: mockGetUser },
      from: () => createFromChain(),
    };
  },
}));

// Mock NextResponse
const mockRedirect = vi.fn().mockImplementation((url) => ({ type: "redirect", url: url.toString() }));
const mockNextCookiesSet = vi.fn();
const mockNext = vi.fn().mockImplementation(() => ({
  cookies: { set: mockNextCookiesSet },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: (...args: unknown[]) => mockNext(...args),
    redirect: (...args: unknown[]) => mockRedirect(...args),
  },
}));

import { updateSession } from "./middleware";

function createMockRequest(pathname: string, cookies?: Record<string, string>) {
  const url = new URL(`http://localhost:3000${pathname}`);
  const cookieStore: { name: string; value: string }[] = [
    { name: "sb-token", value: "abc123" },
  ];
  if (cookies) {
    Object.entries(cookies).forEach(([name, value]) => {
      cookieStore.push({ name, value });
    });
  }
  return {
    cookies: {
      getAll: () => cookieStore,
      get: (name: string) => cookieStore.find((c) => c.name === name),
      set: vi.fn(),
    },
    nextUrl: {
      pathname,
      clone: () => ({ ...url, pathname }),
    },
  } as unknown as Parameters<typeof updateSession>[0];
}

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCookiesConfig = null;
    mockVinculoResult = { data: null };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("permite acesso quando usuário está autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    const result = await updateSession(createMockRequest("/", { prontio_clinica_id: "clinic-1" }));
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("redireciona para /login quando não autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await updateSession(createMockRequest("/pacientes"));
    expect(mockRedirect).toHaveBeenCalled();
  });

  it("permite acesso à /login sem autenticação", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await updateSession(createMockRequest("/login"));
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("permite acesso à /auth sem autenticação", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await updateSession(createMockRequest("/auth/callback"));
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("cookies.getAll delega para request.cookies.getAll", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    await updateSession(createMockRequest("/", { prontio_clinica_id: "clinic-1" }));
    expect(capturedCookiesConfig).not.toBeNull();
    const cookies = capturedCookiesConfig!.getAll();
    expect(cookies).toEqual([
      { name: "sb-token", value: "abc123" },
      { name: "prontio_clinica_id", value: "clinic-1" },
    ]);
  });

  it("cookies.setAll seta cookies no request e na response", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    const mockRequest = createMockRequest("/", { prontio_clinica_id: "clinic-1" });
    await updateSession(mockRequest);
    expect(capturedCookiesConfig).not.toBeNull();

    const cookiesToSet = [
      { name: "sb-token", value: "new-value", options: { path: "/" } },
      { name: "sb-refresh", value: "refresh-value", options: { path: "/" } },
    ];
    capturedCookiesConfig!.setAll(cookiesToSet);

    // Should have set cookies on request
    expect(mockRequest.cookies.set).toHaveBeenCalledWith("sb-token", "new-value");
    expect(mockRequest.cookies.set).toHaveBeenCalledWith("sb-refresh", "refresh-value");

    // Should have created a new NextResponse.next
    expect(mockNext).toHaveBeenCalledTimes(2); // once on init + once in setAll

    // Should have set cookies on the response
    expect(mockNextCookiesSet).toHaveBeenCalledWith("sb-token", "new-value", { path: "/" });
    expect(mockNextCookiesSet).toHaveBeenCalledWith("sb-refresh", "refresh-value", { path: "/" });
  });

  it("auto-sets prontio_clinica_id cookie when missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    mockVinculoResult = { data: { clinica_id: "clinic-auto" } };
    await updateSession(createMockRequest("/"));
    expect(mockNextCookiesSet).toHaveBeenCalledWith(
      "prontio_clinica_id",
      "clinic-auto",
      expect.objectContaining({ path: "/" })
    );
  });

  it("redireciona secretária de rotas restritas para /", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    mockVinculoResult = { data: { clinica_id: "clinic-1", papel: "secretaria" } };
    await updateSession(createMockRequest("/financeiro", { prontio_clinica_id: "clinic-1" }));
    expect(mockRedirect).toHaveBeenCalled();
    const redirectCall = mockRedirect.mock.calls[0][0];
    expect(redirectCall.pathname).toBe("/");
  });

  it("permite profissional_saude acessar rotas protegidas", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    mockVinculoResult = { data: { clinica_id: "clinic-1", papel: "profissional_saude" } };
    await updateSession(createMockRequest("/prontuarios", { prontio_clinica_id: "clinic-1" }));
    // Should not redirect to /
    const dashRedirects = mockRedirect.mock.calls.filter(
      (call: unknown[]) => (call[0] as { pathname: string }).pathname === "/"
    );
    expect(dashRedirects.length).toBe(0);
  });

  describe("sem variáveis de ambiente", () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    });

    it("redireciona para /login em rota protegida", async () => {
      await updateSession(createMockRequest("/pacientes"));
      expect(mockRedirect).toHaveBeenCalled();
    });

    it("permite acesso à /login", async () => {
      const result = await updateSession(createMockRequest("/login"));
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("permite acesso à /auth", async () => {
      const result = await updateSession(createMockRequest("/auth/callback"));
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
