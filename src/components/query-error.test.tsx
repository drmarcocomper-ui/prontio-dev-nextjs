import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryError } from "./query-error";

describe("QueryError", () => {
  it("renderiza título e mensagem padrão", () => {
    render(<QueryError title="Pacientes" />);
    expect(screen.getByText("Pacientes")).toBeInTheDocument();
    expect(
      screen.getByText("Não foi possível carregar os dados. Tente recarregar a página.")
    ).toBeInTheDocument();
  });

  it("renderiza mensagem customizada", () => {
    render(<QueryError title="Prontuários" message="Paciente inválido." />);
    expect(screen.getByText("Prontuários")).toBeInTheDocument();
    expect(screen.getByText("Paciente inválido.")).toBeInTheDocument();
  });

  it("tem role alert na mensagem de erro", () => {
    render(<QueryError title="Agenda" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renderiza título como h1", () => {
    render(<QueryError title="Financeiro" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Financeiro");
  });
});
