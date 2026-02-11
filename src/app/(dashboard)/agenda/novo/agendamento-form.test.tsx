import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

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
  criarAgendamento: vi.fn(),
}));

vi.mock("./patient-search", () => ({
  PatientSearch: () => <input data-testid="patient-search" placeholder="Buscar paciente" />,
}));

import { AgendamentoForm } from "./agendamento-form";

describe("AgendamentoForm", () => {
  it("renderiza todos os campos do formulário", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" />);
    expect(screen.getByText(/Paciente/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Início/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Término/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("preenche a data com o valor padrão", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" />);
    expect(screen.getByLabelText(/Data/)).toHaveValue("2024-06-15");
  });

  it("renderiza as opções de tipo", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" />);
    const select = screen.getByLabelText("Tipo");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Retorno")).toBeInTheDocument();
    expect(screen.getByText("Exame")).toBeInTheDocument();
    expect(screen.getByText("Procedimento")).toBeInTheDocument();
    expect(screen.getByText("Avaliação")).toBeInTheDocument();
  });

  it("renderiza o botão Agendar", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" />);
    expect(screen.getByRole("button", { name: "Agendar" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para agenda com data", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/agenda?data=2024-06-15");
  });

  it("campos obrigatórios estão marcados", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" />);
    expect(screen.getByLabelText(/Data/)).toBeRequired();
    expect(screen.getByLabelText(/Início/)).toBeRequired();
    expect(screen.getByLabelText(/Término/)).toBeRequired();
  });

  it("renderiza o PatientSearch", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });
});
