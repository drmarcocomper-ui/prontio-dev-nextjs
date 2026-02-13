import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Ref } from "react";

const formState: Ref<{ error?: string }> = { current: {} };
const formPending: Ref<boolean> = { current: false };

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useActionState: () => [formState.current, vi.fn(), formPending.current] };
});

import LoginForm from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza campos de e-mail e senha", () => {
    render(<LoginForm />);
    const email = screen.getByLabelText("E-mail");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toBeRequired();

    const password = screen.getByLabelText("Senha");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).toBeRequired();
  });

  it("renderiza o botão Entrar", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("formulário tem aria-label", () => {
    render(<LoginForm />);
    expect(screen.getByRole("form", { name: "Formulário de login" })).toBeInTheDocument();
  });

  it("exibe erro do state com role=alert", () => {
    formState.current = { error: "E-mail ou senha incorretos." };
    render(<LoginForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
  });

  it("não exibe erro quando state vazio", () => {
    render(<LoginForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("desabilita inputs e botão durante isPending", () => {
    formPending.current = true;
    render(<LoginForm />);
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.getByLabelText("Senha")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeDisabled();
  });

  it("formulário tem aria-busy durante isPending", () => {
    formPending.current = true;
    render(<LoginForm />);
    expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "true");
  });
});
