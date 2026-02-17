import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Ref } from "react";

const formState: Ref<{ error?: string; success?: boolean }> = { current: {} };
const formPending: Ref<boolean> = { current: false };

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useActionState: () => [formState.current, vi.fn(), formPending.current] };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../actions", () => ({
  redefinirSenha: vi.fn(),
}));

import { RedefinirSenhaForm } from "./redefinir-senha-form";

describe("RedefinirSenhaForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza campo Nova senha", () => {
    render(<RedefinirSenhaForm />);
    const password = screen.getByLabelText("Nova senha");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toBeRequired();
  });

  it("renderiza campo Confirmar nova senha", () => {
    render(<RedefinirSenhaForm />);
    const confirm = screen.getByLabelText("Confirmar nova senha");
    expect(confirm).toHaveAttribute("type", "password");
    expect(confirm).toHaveAttribute("autocomplete", "new-password");
    expect(confirm).toBeRequired();
  });

  it("renderiza o botão Redefinir senha", () => {
    render(<RedefinirSenhaForm />);
    expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeInTheDocument();
  });

  it("exibe erro do state com role=alert", () => {
    formState.current = { error: "As senhas não coincidem." };
    render(<RedefinirSenhaForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("As senhas não coincidem.");
  });

  it("não exibe erro quando state vazio", () => {
    render(<RedefinirSenhaForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("desabilita campos e botão durante isPending", () => {
    formPending.current = true;
    render(<RedefinirSenhaForm />);
    expect(screen.getByLabelText("Nova senha")).toBeDisabled();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeDisabled();
  });

  it("formulário tem aria-busy durante isPending", () => {
    formPending.current = true;
    const { container } = render(<RedefinirSenhaForm />);
    expect(container.querySelector("form")).toHaveAttribute("aria-busy", "true");
  });

  it("exibe mensagem de sucesso quando state.success é true", () => {
    formState.current = { success: true };
    render(<RedefinirSenhaForm />);
    expect(screen.getByText("Senha redefinida!")).toBeInTheDocument();
    expect(screen.getByText("Sua senha foi alterada com sucesso.")).toBeInTheDocument();
  });

  it("exibe link para login na tela de sucesso", () => {
    formState.current = { success: true };
    render(<RedefinirSenhaForm />);
    const link = screen.getByRole("link", { name: "Ir para o login" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("não exibe formulário quando state.success é true", () => {
    formState.current = { success: true };
    render(<RedefinirSenhaForm />);
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Confirmar nova senha")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Redefinir senha" })).not.toBeInTheDocument();
  });
});
