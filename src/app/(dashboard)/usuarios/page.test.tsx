import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

import UsuariosPage from "./page";
import { redirect } from "next/navigation";

describe("UsuariosPage", () => {
  it("redireciona para /configuracoes?tab=usuarios", () => {
    expect(() => UsuariosPage()).toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/configuracoes?tab=usuarios");
  });
});
