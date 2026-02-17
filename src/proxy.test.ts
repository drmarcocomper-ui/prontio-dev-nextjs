import { describe, it, expect, vi } from "vitest";

const mockUpdateSession = vi.fn().mockResolvedValue({ status: 200 });

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

import { proxy, config } from "./proxy";

describe("proxy", () => {
  it("chama updateSession com o request", async () => {
    const mockRequest = { url: "http://localhost:3000/" } as Parameters<typeof proxy>[0];
    await proxy(mockRequest);
    expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
  });

  it("retorna o resultado de updateSession", async () => {
    const mockRequest = { url: "http://localhost:3000/" } as Parameters<typeof proxy>[0];
    const result = await proxy(mockRequest);
    expect(result).toEqual({ status: 200 });
  });

  it("exporta config com matcher correto", () => {
    expect(config.matcher).toBeDefined();
    expect(config.matcher).toHaveLength(1);
    expect(config.matcher[0]).toContain("_next/static");
  });
});
