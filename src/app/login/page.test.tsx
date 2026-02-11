import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./actions", () => ({
  login: vi.fn(),
}));

import LoginPage from "./page";

async function renderPage(searchParams: { error?: string } = {}) {
  const jsx = await LoginPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("LoginPage", () => {
  it("renderiza o logo e nome Prontio", async () => {
    await renderPage();
    expect(screen.getByText("P")).toBeInTheDocument();
    expect(screen.getByText("Prontio")).toBeInTheDocument();
  });

  it("renderiza a mensagem de boas-vindas", async () => {
    await renderPage();
    expect(screen.getByText("Entre para acessar o sistema")).toBeInTheDocument();
  });

  it("renderiza o campo de e-mail", async () => {
    await renderPage();
    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toBeRequired();
  });

  it("renderiza o campo de senha", async () => {
    await renderPage();
    const input = screen.getByLabelText("Senha");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("name", "password");
    expect(input).toBeRequired();
  });

  it("renderiza o botão Entrar", async () => {
    await renderPage();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("exibe mensagem de erro quando searchParams.error presente", async () => {
    await renderPage({ error: "Credenciais inválidas" });
    expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
  });

  it("não exibe mensagem de erro quando searchParams.error ausente", async () => {
    await renderPage();
    expect(screen.queryByText("Credenciais inválidas")).not.toBeInTheDocument();
  });
});
