import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateServerClient = vi.fn().mockReturnValue({ from: vi.fn() });
const mockCookieStore = {
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

import { createClient } from "./server";

describe("createClient (server)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("chama createServerClient com as variáveis de ambiente", async () => {
    await createClient();
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  it("retorna o cliente do Supabase", async () => {
    const client = await createClient();
    expect(client).toBeDefined();
  });

  it("cookies.getAll delega para o cookieStore", async () => {
    await createClient();
    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    cookiesConfig.getAll();
    expect(mockCookieStore.getAll).toHaveBeenCalled();
  });

  it("cookies.setAll delega para o cookieStore", async () => {
    await createClient();
    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    cookiesConfig.setAll([{ name: "test", value: "val", options: {} }]);
    expect(mockCookieStore.set).toHaveBeenCalledWith("test", "val", {});
  });
});
