import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateBrowserClient = vi.fn().mockReturnValue({ from: vi.fn() });

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => mockCreateBrowserClient(...args),
}));

import { createClient } from "./client";

describe("createClient (browser)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("chama createBrowserClient com as variáveis de ambiente", () => {
    createClient();
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key"
    );
  });

  it("retorna o cliente do Supabase", () => {
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
  });
});
