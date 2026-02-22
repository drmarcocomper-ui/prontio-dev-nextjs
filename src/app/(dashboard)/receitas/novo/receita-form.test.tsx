import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));

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
  criarReceita: vi.fn(),
  atualizarReceita: vi.fn(),
}));

vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return { ...actual };
});

vi.mock("@/app/(dashboard)/agenda/novo/patient-search", () => ({
  PatientSearch: () => <input data-testid="patient-search" />,
}));

import { ReceitaForm } from "./receita-form";

describe("ReceitaForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

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

  it("campo data tem valor padrão de hoje", () => {
    render(<ReceitaForm />);
    const input = screen.getByLabelText(/Data/);
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    expect(input).toHaveValue(today);
  });

  it("renderiza o PatientSearch", () => {
    render(<ReceitaForm />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });

  it("renderiza opções de tipo", () => {
    render(<ReceitaForm />);
    expect(screen.getByText("Simples")).toBeInTheDocument();
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

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar receita." };
    render(<ReceitaForm />);
    expect(screen.getByText("Erro ao salvar receita.")).toBeInTheDocument();
  });

  it("exibe erro de campo quando fieldErrors está definido", () => {
    formState.current = { fieldErrors: { paciente_id: "Selecione um paciente." } };
    render(<ReceitaForm />);
    expect(screen.getByText("Selecione um paciente.")).toBeInTheDocument();
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<ReceitaForm />);
    const button = screen.getByRole("button", { name: /Salvar receita/ });
    expect(button).toBeDisabled();
  });

  it("campo medicamentos tem maxLength", () => {
    render(<ReceitaForm />);
    const textarea = screen.getByLabelText("Medicamentos *") as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(5000);
  });

  it("campo observações tem maxLength", () => {
    render(<ReceitaForm />);
    const textarea = screen.getByLabelText("Observações") as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(1000);
  });

  it("campo data tem max igual a hoje", () => {
    render(<ReceitaForm />);
    const input = screen.getByLabelText(/Data/) as HTMLInputElement;
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    expect(input.max).toBe(today);
  });
});
