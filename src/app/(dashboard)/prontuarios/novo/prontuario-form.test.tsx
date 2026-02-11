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
  criarProntuario: vi.fn(),
}));

vi.mock("@/app/(dashboard)/agenda/novo/patient-search", () => ({
  PatientSearch: () => <input data-testid="patient-search" />,
}));

import { ProntuarioForm } from "./prontuario-form";

describe("ProntuarioForm", () => {
  it("renderiza todos os campos do formulário", () => {
    render(<ProntuarioForm />);
    expect(screen.getByText(/Paciente/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("CID")).toBeInTheDocument();
    expect(screen.getByLabelText("Queixa principal")).toBeInTheDocument();
    expect(screen.getByLabelText("História da doença atual")).toBeInTheDocument();
    expect(screen.getByLabelText("Exame físico")).toBeInTheDocument();
    expect(screen.getByLabelText("Hipótese diagnóstica")).toBeInTheDocument();
    expect(screen.getByLabelText("Conduta")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("renderiza a seção Evolução clínica", () => {
    render(<ProntuarioForm />);
    expect(screen.getByText("Evolução clínica")).toBeInTheDocument();
  });

  it("renderiza o botão Salvar prontuário", () => {
    render(<ProntuarioForm />);
    expect(screen.getByRole("button", { name: "Salvar prontuário" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para /prontuarios", () => {
    render(<ProntuarioForm />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios");
  });

  it("campo data é obrigatório e tem valor padrão de hoje", () => {
    render(<ProntuarioForm />);
    const input = screen.getByLabelText(/Data/);
    expect(input).toBeRequired();
    const today = new Date().toISOString().split("T")[0];
    expect(input).toHaveValue(today);
  });

  it("renderiza o PatientSearch", () => {
    render(<ProntuarioForm />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });

  it("renderiza opções de tipo", () => {
    render(<ProntuarioForm />);
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Retorno")).toBeInTheDocument();
    expect(screen.getByText("Exame")).toBeInTheDocument();
    expect(screen.getByText("Procedimento")).toBeInTheDocument();
    expect(screen.getByText("Avaliação")).toBeInTheDocument();
  });
});
