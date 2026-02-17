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
  enviarResetSenha: vi.fn(),
}));

import { EsqueciSenhaForm } from "./esqueci-senha-form";

describe("EsqueciSenhaForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza campo de e-mail", () => {
    render(<EsqueciSenhaForm />);
    const email = screen.getByLabelText("E-mail");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toBeRequired();
  });

  it("renderiza o botão Enviar link de recuperação", () => {
    render(<EsqueciSenhaForm />);
    expect(screen.getByRole("button", { name: "Enviar link de recuperação" })).toBeInTheDocument();
  });

  it("renderiza link Voltar para o login", () => {
    render(<EsqueciSenhaForm />);
    const link = screen.getByRole("link", { name: "Voltar para o login" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("exibe erro do state com role=alert", () => {
    formState.current = { error: "Informe seu e-mail." };
    render(<EsqueciSenhaForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("Informe seu e-mail.");
  });

  it("não exibe erro quando state vazio", () => {
    render(<EsqueciSenhaForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("desabilita input e botão durante isPending", () => {
    formPending.current = true;
    render(<EsqueciSenhaForm />);
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviar link de recuperação" })).toBeDisabled();
  });

  it("formulário tem aria-busy durante isPending", () => {
    formPending.current = true;
    const { container } = render(<EsqueciSenhaForm />);
    expect(container.querySelector("form")).toHaveAttribute("aria-busy", "true");
  });

  it("exibe mensagem de sucesso quando state.success é true", () => {
    formState.current = { success: true };
    render(<EsqueciSenhaForm />);
    expect(screen.getByText("E-mail enviado!")).toBeInTheDocument();
    expect(screen.getByText(/Se este e-mail estiver cadastrado/)).toBeInTheDocument();
  });

  it("exibe link para login na tela de sucesso", () => {
    formState.current = { success: true };
    render(<EsqueciSenhaForm />);
    const link = screen.getByRole("link", { name: "Voltar para o login" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("não exibe formulário quando state.success é true", () => {
    formState.current = { success: true };
    render(<EsqueciSenhaForm />);
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar link de recuperação" })).not.toBeInTheDocument();
  });
});
