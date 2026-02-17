import { describe, it, expect, vi } from "vitest";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("REDIRECT");
  },
}));

import ExamesPage from "./page";

describe("ExamesPage", () => {
  it("redireciona para /pacientes", () => {
    expect(() => ExamesPage()).toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });
});
