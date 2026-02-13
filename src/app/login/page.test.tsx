import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./login-form", () => ({
  default: () => <div data-testid="login-form">LoginForm</div>,
}));

import LoginPage from "./page";

async function renderPage(searchParams: { error?: string } = {}) {
  const jsx = await LoginPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("LoginPage", () => {
  it("renderiza o logo e nome Prontio", async () => {
    await renderPage();
    expect(screen.getAllByText("P").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Prontio").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza a mensagem de boas-vindas", async () => {
    await renderPage();
    expect(screen.getByText("Entre para acessar o sistema")).toBeInTheDocument();
  });

  it("renderiza o LoginForm", async () => {
    await renderPage();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("exibe mensagem mapeada para código auth_erro", async () => {
    await renderPage({ error: "auth_erro" });
    expect(screen.getByRole("alert")).toHaveTextContent("Erro ao autenticar. Tente novamente.");
  });

  it("exibe mensagem fallback para código desconhecido", async () => {
    await renderPage({ error: "unknown_code" });
    expect(screen.getByRole("alert")).toHaveTextContent("Ocorreu um erro. Tente novamente.");
  });

  it("não exibe alerta quando sem erro", async () => {
    await renderPage();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
