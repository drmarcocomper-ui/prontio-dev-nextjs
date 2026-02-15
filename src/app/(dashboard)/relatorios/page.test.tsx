import { describe, it, expect, vi } from "vitest";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT");
  },
}));

import RelatoriosPage from "./page";

describe("RelatoriosPage", () => {
  it("redireciona para /relatorios/financeiro", () => {
    expect(() => RelatoriosPage()).toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/relatorios/financeiro");
  });
});
