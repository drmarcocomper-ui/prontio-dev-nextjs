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
  criarReceita: vi.fn(),
  atualizarReceita: vi.fn(),
}));

vi.mock("@/app/(dashboard)/agenda/novo/patient-search", () => ({
  PatientSearch: () => <input data-testid="patient-search" />,
}));

import { ReceitaForm } from "./receita-form";

describe("ReceitaForm", () => {
  it("renderiza todos os campos do formulário", () => {
    render(<ReceitaForm />);
    expect(screen.getByText(/Paciente/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo da receita *")).toBeInTheDocument();
    expect(screen.getByLabelText("Medicamentos *")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("renderiza o botão Salvar receita", () => {
    render(<ReceitaForm />);
    expect(screen.getByRole("button", { name: "Salvar receita" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para /receitas", () => {
    render(<ReceitaForm />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/receitas");
  });

  it("campo data é obrigatório e tem valor padrão de hoje", () => {
    render(<ReceitaForm />);
    const input = screen.getByLabelText(/Data/);
    expect(input).toBeRequired();
    const today = new Date().toISOString().split("T")[0];
    expect(input).toHaveValue(today);
  });

  it("renderiza o PatientSearch", () => {
    render(<ReceitaForm />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });

  it("renderiza opções de tipo", () => {
    render(<ReceitaForm />);
    expect(screen.getByText("Simples")).toBeInTheDocument();
    expect(screen.getByText("Especial")).toBeInTheDocument();
    expect(screen.getByText("Controle Especial")).toBeInTheDocument();
  });

  it("campo medicamentos é obrigatório", () => {
    render(<ReceitaForm />);
    const textarea = screen.getByLabelText("Medicamentos *");
    expect(textarea).toBeRequired();
  });

  it("renderiza botão Salvar alterações no modo edição", () => {
    render(<ReceitaForm defaults={{ id: "rec-1", paciente_id: "p-1", paciente_nome: "Maria" }} />);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para receita quando editando", () => {
    render(<ReceitaForm defaults={{ id: "rec-1" }} />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/receitas/rec-1");
  });

  it("usa cancelHref customizado quando fornecido", () => {
    render(<ReceitaForm cancelHref="/pacientes/p-1" />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });
});
