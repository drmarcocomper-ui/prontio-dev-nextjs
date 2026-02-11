import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

// Mock NextResponse
const mockRedirect = vi.fn().mockImplementation((url) => ({ type: "redirect", url: url.toString() }));
const mockNext = vi.fn().mockImplementation(() => ({
  cookies: { set: vi.fn() },
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
      getAll: () => [],
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
});
