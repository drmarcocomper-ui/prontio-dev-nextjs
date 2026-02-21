import { describe, it, expect, vi } from "vitest";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("REDIRECT");
  },
}));

import AtestadosPage from "./page";

describe("AtestadosPage", () => {
  it("redireciona para /pacientes", () => {
    expect(() => AtestadosPage()).toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });
});
