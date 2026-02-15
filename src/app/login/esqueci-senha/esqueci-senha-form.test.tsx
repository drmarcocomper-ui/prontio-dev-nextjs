import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Ref } from "react";

const formState: Ref<Record<string, unknown>> = { current: {} };
const formPending: Ref<boolean> = { current: false };

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useActionState: () => [formState.current, vi.fn(), formPending.current] };
});

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
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("renderiza botão \"Enviar link de recuperação\"", () => {
    render(<EsqueciSenhaForm />);
    expect(screen.getByRole("button", { name: "Enviar link de recuperação" })).toBeInTheDocument();
  });

  it("renderiza link \"Voltar para o login\"", () => {
    render(<EsqueciSenhaForm />);
    expect(screen.getByRole("link", { name: "Voltar para o login" })).toBeInTheDocument();
  });

  it("desabilita campo e botão quando pendente", () => {
    formPending.current = true;
    render(<EsqueciSenhaForm />);
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviar link de recuperação" })).toBeDisabled();
  });

  it("exibe mensagem de sucesso quando state.success é true", () => {
    formState.current = { success: true };
    render(<EsqueciSenhaForm />);
    expect(screen.getByText("E-mail enviado!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para o login" })).toBeInTheDocument();
  });

  it("exibe mensagem de erro quando state tem error", () => {
    formState.current = { error: "Erro" };
    render(<EsqueciSenhaForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("Erro");
  });
});
