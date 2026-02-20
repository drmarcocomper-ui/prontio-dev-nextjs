import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { UsuarioListItem } from "@/app/(dashboard)/usuarios/types";

const mockRemoverVinculo = vi.hoisted(() => vi.fn());

vi.mock("@/app/(dashboard)/usuarios/actions", () => ({
  removerVinculo: mockRemoverVinculo,
}));

vi.mock("@/components/delete-button", () => ({
  DeleteButton: ({ title }: { title: string }) => (
    <button data-testid="delete-button" title={title}>Excluir</button>
  ),
}));

import { UsuarioItem } from "./usuario-item";

const baseUsuario: UsuarioListItem = {
  vinculo_id: "v-1",
  user_id: "u-1",
  email: "user@test.com",
  papel: "secretaria",
  clinica_id: "c-1",
  clinica_nome: "Clínica Teste",
  created_at: "2024-01-01T00:00:00Z",
};

describe("UsuarioItem", () => {
  it("renderiza email do usuário", () => {
    render(<UsuarioItem usuario={baseUsuario} isSelf={false} />);
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("mostra user_id truncado quando email está vazio", () => {
    const semEmail = { ...baseUsuario, email: "", user_id: "abcdefgh-1234-5678" };
    render(<UsuarioItem usuario={semEmail} isSelf={false} />);
    expect(screen.getByText("abcdefgh")).toBeInTheDocument();
  });

  it("renderiza badge de papel correto para secretaria", () => {
    render(<UsuarioItem usuario={baseUsuario} isSelf={false} />);
    expect(screen.getByText("Secretária")).toBeInTheDocument();
  });

  it("renderiza badge de papel correto para gestor", () => {
    render(<UsuarioItem usuario={{ ...baseUsuario, papel: "gestor" }} isSelf={false} />);
    expect(screen.getByText("Gestor")).toBeInTheDocument();
  });

  it("renderiza badge de papel correto para profissional_saude", () => {
    render(<UsuarioItem usuario={{ ...baseUsuario, papel: "profissional_saude" }} isSelf={false} />);
    expect(screen.getByText("Médico")).toBeInTheDocument();
  });

  it("renderiza nome da clínica e data formatada", () => {
    const usuario = { ...baseUsuario, created_at: "2024-06-15T12:00:00Z" };
    render(<UsuarioItem usuario={usuario} isSelf={false} />);
    expect(screen.getByText(/Clínica Teste/)).toBeInTheDocument();
    expect(screen.getByText(/15\/06\/2024/)).toBeInTheDocument();
  });

  it("mostra badge 'Você' quando isSelf é true", () => {
    render(<UsuarioItem usuario={baseUsuario} isSelf={true} />);
    expect(screen.getByText("Você")).toBeInTheDocument();
  });

  it("não mostra badge 'Você' quando isSelf é false", () => {
    render(<UsuarioItem usuario={baseUsuario} isSelf={false} />);
    expect(screen.queryByText("Você")).not.toBeInTheDocument();
  });

  it("mostra botões de ação quando isSelf é false", () => {
    render(<UsuarioItem usuario={baseUsuario} isSelf={false} />);
    expect(screen.getByLabelText("Editar usuário")).toBeInTheDocument();
    expect(screen.getByTestId("delete-button")).toBeInTheDocument();
  });

  it("esconde botões de ação quando isSelf é true", () => {
    render(<UsuarioItem usuario={baseUsuario} isSelf={true} />);
    expect(screen.queryByLabelText("Editar usuário")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-button")).not.toBeInTheDocument();
  });

  it("link de editar aponta para a rota correta", () => {
    render(<UsuarioItem usuario={baseUsuario} isSelf={false} />);
    const link = screen.getByLabelText("Editar usuário");
    expect(link).toHaveAttribute("href", "/usuarios/v-1/editar");
  });
});
