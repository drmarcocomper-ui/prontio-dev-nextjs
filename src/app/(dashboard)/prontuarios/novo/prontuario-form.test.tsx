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
  criarProntuario: vi.fn(),
  atualizarProntuario: vi.fn(),
}));

vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return { ...actual };
});

vi.mock("@/app/(dashboard)/agenda/novo/patient-search", () => ({
  PatientSearch: () => <input data-testid="patient-search" />,
}));

import { ProntuarioForm } from "./prontuario-form";

describe("ProntuarioForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza todos os campos do formulário", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
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
    render(<ProntuarioForm medicoId="doc-1" />);
    expect(screen.getByText("Evolução clínica")).toBeInTheDocument();
  });

  it("renderiza o botão Salvar prontuário", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
    expect(screen.getByRole("button", { name: "Salvar prontuário" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para /prontuarios", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios");
  });

  it("campo data é obrigatório e tem valor padrão de hoje", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
    const input = screen.getByLabelText(/Data/);
    expect(input).toBeRequired();
    const today = new Date().toISOString().split("T")[0];
    expect(input).toHaveValue(today);
  });

  it("campo data tem max igual a hoje", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
    const input = screen.getByLabelText(/Data/) as HTMLInputElement;
    const today = new Date().toISOString().split("T")[0];
    expect(input.max).toBe(today);
  });

  it("renderiza o PatientSearch", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });

  it("renderiza opções de tipo", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Retorno")).toBeInTheDocument();
    expect(screen.getByText("Exame")).toBeInTheDocument();
    expect(screen.getByText("Procedimento")).toBeInTheDocument();
    expect(screen.getByText("Avaliação")).toBeInTheDocument();
  });

  it("textareas têm maxLength definido", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
    const queixa = screen.getByLabelText("Queixa principal") as HTMLTextAreaElement;
    expect(queixa.maxLength).toBe(5000);
    const obs = screen.getByLabelText("Observações") as HTMLTextAreaElement;
    expect(obs.maxLength).toBe(1000);
  });

  it("CID tem maxLength definido", () => {
    render(<ProntuarioForm medicoId="doc-1" />);
    const cid = screen.getByLabelText("CID") as HTMLInputElement;
    expect(cid.maxLength).toBe(20);
  });

  it("renderiza botão Salvar alterações no modo edição", () => {
    render(<ProntuarioForm medicoId="doc-1" defaults={{ id: "pr-1", paciente_id: "p-1", paciente_nome: "Maria" }} />);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para prontuário quando editando", () => {
    render(<ProntuarioForm medicoId="doc-1" defaults={{ id: "pr-1" }} />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios/pr-1");
  });

  it("usa cancelHref customizado quando fornecido", () => {
    render(<ProntuarioForm medicoId="doc-1" cancelHref="/pacientes/p-1" />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar prontuário." };
    render(<ProntuarioForm medicoId="doc-1" />);
    expect(screen.getByText("Erro ao salvar prontuário.")).toBeInTheDocument();
  });

  it("exibe erro de campo quando fieldErrors está definido", () => {
    formState.current = { fieldErrors: { paciente_id: "Selecione um paciente." } };
    render(<ProntuarioForm medicoId="doc-1" />);
    expect(screen.getByText("Selecione um paciente.")).toBeInTheDocument();
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<ProntuarioForm medicoId="doc-1" />);
    const button = screen.getByRole("button", { name: /Salvar prontuário/ });
    expect(button).toBeDisabled();
  });

  it("inclui input hidden com id no modo edição", () => {
    render(<ProntuarioForm medicoId="doc-1" defaults={{ id: "pr-1" }} />);
    const hidden = document.querySelector('input[name="id"]') as HTMLInputElement;
    expect(hidden).toBeInTheDocument();
    expect(hidden.value).toBe("pr-1");
  });
});
