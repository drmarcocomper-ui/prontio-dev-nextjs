import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./actions", () => ({
  login: vi.fn(),
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  it("renderiza o logo e nome Prontio", () => {
    render(<LoginPage />);
    expect(screen.getByText("P")).toBeInTheDocument();
    expect(screen.getByText("Prontio")).toBeInTheDocument();
  });

  it("renderiza a mensagem de boas-vindas", () => {
    render(<LoginPage />);
    expect(screen.getByText("Entre para acessar o sistema")).toBeInTheDocument();
  });

  it("renderiza o campo de e-mail", () => {
    render(<LoginPage />);
    const input = screen.getByLabelText("E-mail");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toBeRequired();
  });

  it("renderiza o campo de senha", () => {
    render(<LoginPage />);
    const input = screen.getByLabelText("Senha");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("name", "password");
    expect(input).toBeRequired();
  });

  it("renderiza o botão Entrar", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });
});
