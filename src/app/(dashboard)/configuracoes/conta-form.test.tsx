import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./actions", () => ({
  alterarSenha: vi.fn(),
}));

import { ContaForm } from "./conta-form";

describe("ContaForm", () => {
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
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
  });

  it("campos de senha são obrigatórios", () => {
    render(<ContaForm email="user@test.com" />);
    expect(screen.getByLabelText("Nova senha")).toBeRequired();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeRequired();
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
});
