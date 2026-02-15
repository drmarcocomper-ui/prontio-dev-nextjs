import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateClient = vi.fn().mockReturnValue({ from: vi.fn() });

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

import { createAdminClient } from "./admin";

describe("createAdminClient", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-123");
    mockCreateClient.mockClear();
  });

  it("cria client com URL e service role key do env", () => {
    createAdminClient();
    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-role-key-123",
      expect.objectContaining({
        auth: { autoRefreshToken: false, persistSession: false },
      }),
    );
  });

  it("lança erro se NEXT_PUBLIC_SUPABASE_URL não está definida", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(() => createAdminClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("lança erro se SUPABASE_SERVICE_ROLE_KEY não está definida", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => createAdminClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });
});
