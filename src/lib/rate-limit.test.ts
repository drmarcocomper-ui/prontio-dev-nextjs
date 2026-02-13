import { describe, it, expect } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("permite até maxAttempts tentativas", () => {
    const key = "test-allow-" + Date.now();
    for (let i = 0; i < 3; i++) {
      const result = rateLimit({ key, maxAttempts: 3, windowMs: 60000 });
      expect(result.success).toBe(true);
    }
  });

  it("bloqueia após exceder maxAttempts", () => {
    const key = "test-block-" + Date.now();
    for (let i = 0; i < 3; i++) {
      rateLimit({ key, maxAttempts: 3, windowMs: 60000 });
    }
    const result = rateLimit({ key, maxAttempts: 3, windowMs: 60000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("retorna remaining correto", () => {
    const key = "test-remaining-" + Date.now();
    const r1 = rateLimit({ key, maxAttempts: 5, windowMs: 60000 });
    expect(r1.remaining).toBe(4);
    const r2 = rateLimit({ key, maxAttempts: 5, windowMs: 60000 });
    expect(r2.remaining).toBe(3);
  });

  it("reseta após windowMs expirar", async () => {
    const key = "test-reset-" + Date.now();
    rateLimit({ key, maxAttempts: 1, windowMs: 50 });

    // Espera a janela expirar
    await new Promise((r) => setTimeout(r, 60));
    const result = rateLimit({ key, maxAttempts: 1, windowMs: 50 });
    expect(result.success).toBe(true);
  });
});
