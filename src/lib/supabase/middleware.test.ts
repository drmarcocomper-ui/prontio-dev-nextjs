import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();

// Capture the cookies config passed to createServerClient
let capturedCookiesConfig: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
} | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, config: { cookies: typeof capturedCookiesConfig }) => {
    capturedCookiesConfig = config.cookies;
    return {
      auth: { getUser: mockGetUser },
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

function createMockRequest(pathname: string) {
  const url = new URL(`http://localhost:3000${pathname}`);
  return {
    cookies: {
      getAll: () => [{ name: "sb-token", value: "abc123" }],
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
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("permite acesso quando usuário está autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    const result = await updateSession(createMockRequest("/"));
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
    await updateSession(createMockRequest("/"));
    expect(capturedCookiesConfig).not.toBeNull();
    const cookies = capturedCookiesConfig!.getAll();
    expect(cookies).toEqual([{ name: "sb-token", value: "abc123" }]);
  });

  it("cookies.setAll seta cookies no request e na response", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    const mockRequest = createMockRequest("/");
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
});
