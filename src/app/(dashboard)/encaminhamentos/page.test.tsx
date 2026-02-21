import { describe, it, expect, vi } from "vitest";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("REDIRECT");
  },
}));

import EncaminhamentosPage from "./page";

describe("EncaminhamentosPage", () => {
  it("redireciona para /pacientes", () => {
    expect(() => EncaminhamentosPage()).toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });
});
