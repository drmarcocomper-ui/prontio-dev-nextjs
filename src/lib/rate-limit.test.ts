import { describe, it, expect, vi } from "vitest";

// Mock admin client to force in-memory fallback
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => { throw new Error("no admin in test"); },
}));

import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("permite até maxAttempts tentativas", async () => {
    const key = "test-allow-" + Date.now();
    for (let i = 0; i < 3; i++) {
      const result = await rateLimit({ key, maxAttempts: 3, windowMs: 60000 });
      expect(result.success).toBe(true);
    }
  });

  it("bloqueia após exceder maxAttempts", async () => {
    const key = "test-block-" + Date.now();
    for (let i = 0; i < 3; i++) {
      await rateLimit({ key, maxAttempts: 3, windowMs: 60000 });
    }
    const result = await rateLimit({ key, maxAttempts: 3, windowMs: 60000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("retorna remaining correto", async () => {
    const key = "test-remaining-" + Date.now();
    const r1 = await rateLimit({ key, maxAttempts: 5, windowMs: 60000 });
    expect(r1.remaining).toBe(4);
    const r2 = await rateLimit({ key, maxAttempts: 5, windowMs: 60000 });
    expect(r2.remaining).toBe(3);
  });

  it("reseta após windowMs expirar", async () => {
    const key = "test-reset-" + Date.now();
    await rateLimit({ key, maxAttempts: 1, windowMs: 50 });

    // Espera a janela expirar
    await new Promise((r) => setTimeout(r, 60));
    const result = await rateLimit({ key, maxAttempts: 1, windowMs: 50 });
    expect(result.success).toBe(true);
  });
});
