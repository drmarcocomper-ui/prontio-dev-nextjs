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
  redefinirSenha: vi.fn(),
}));

import { RedefinirSenhaForm } from "./redefinir-senha-form";

describe("RedefinirSenhaForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza campo \"Nova senha\"", () => {
    render(<RedefinirSenhaForm />);
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
  });

  it("renderiza campo \"Confirmar nova senha\"", () => {
    render(<RedefinirSenhaForm />);
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
  });

  it("renderiza botão \"Redefinir senha\"", () => {
    render(<RedefinirSenhaForm />);
    expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeInTheDocument();
  });

  it("desabilita campos e botão quando pendente", () => {
    formPending.current = true;
    render(<RedefinirSenhaForm />);
    expect(screen.getByLabelText("Nova senha")).toBeDisabled();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeDisabled();
  });

  it("exibe mensagem de sucesso quando state.success é true", () => {
    formState.current = { success: true };
    render(<RedefinirSenhaForm />);
    expect(screen.getByText("Senha redefinida!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o login" })).toBeInTheDocument();
  });

  it("exibe mensagem de erro quando state tem error", () => {
    formState.current = { error: "Erro" };
    render(<RedefinirSenhaForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("Erro");
  });
});
