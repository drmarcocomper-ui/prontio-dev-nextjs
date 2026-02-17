import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useActionState: () => [formState.current, vi.fn(), formPending.current] };
});

vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

vi.mock("./actions", () => ({
  alterarSenha: vi.fn(),
}));

vi.mock("./constants", async () => {
  const actual = await vi.importActual("./constants");
  return { ...actual };
});

import { ContaForm } from "./conta-form";

describe("ContaForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("exibe o email da conta", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByText("E-mail da conta")).toBeInTheDocument();
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("renderiza a seção Alterar senha", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getAllByText("Alterar senha").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza os campos de senha", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByLabelText("Senha atual")).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
  });

  it("campos de senha são obrigatórios", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByLabelText("Senha atual")).toBeRequired();
    expect(screen.getByLabelText("Nova senha")).toBeRequired();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeRequired();
  });

  it("campo senha atual é do tipo password", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByLabelText("Senha atual")).toHaveAttribute("type", "password");
  });

  it("campos de senha têm minLength 6", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("minlength", "6");
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute("minlength", "6");
  });

  it("campos de senha são do tipo password", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute("type", "password");
  });

  it("renderiza o botão Alterar senha", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByRole("button", { name: "Alterar senha" })).toBeInTheDocument();
  });

  it("campos de senha têm maxLength 128", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("maxlength", "128");
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute("maxlength", "128");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao alterar senha." };
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByText("Erro ao alterar senha.")).toBeInTheDocument();
  });

  it("chama toast.success quando state.success é true", () => {
    formState.current = { success: true };
    render(<ContaForm email="user@test.com" />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Senha alterada com sucesso.");
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<ContaForm email="user@test.com" />);
    const button = screen.getByRole("button", { name: /Alterar senha/ });
    expect(button).toBeDisabled();
  });
});
