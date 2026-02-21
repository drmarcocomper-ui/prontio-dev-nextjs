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
  criarExame: vi.fn(),
  atualizarExame: vi.fn(),
}));

vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return { ...actual };
});

vi.mock("@/app/(dashboard)/agenda/novo/patient-search", () => ({
  PatientSearch: () => <input data-testid="patient-search" />,
}));

vi.mock("./exame-search", () => ({
  ExameSearch: () => <input data-testid="exame-search" />,
}));

import { ExameForm } from "./exame-form";

describe("ExameForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza todos os campos do formulário", () => {
    render(<ExameForm />);
    expect(screen.getByText(/Paciente/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exames solicitados/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Indicação clínica/)).toBeInTheDocument();
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("renderiza o botão Salvar solicitação", () => {
    render(<ExameForm />);
    expect(screen.getByRole("button", { name: "Salvar solicitação" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para /pacientes quando criando", () => {
    render(<ExameForm />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes");
  });

  it("campo data tem valor padrão de hoje", () => {
    render(<ExameForm />);
    const input = screen.getByLabelText(/Data/);
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    expect(input).toHaveValue(today);
  });

  it("renderiza o PatientSearch", () => {
    render(<ExameForm />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });

  it("renderiza o ExameSearch", () => {
    render(<ExameForm />);
    expect(screen.getByTestId("exame-search")).toBeInTheDocument();
  });

  it("campo exames é obrigatório", () => {
    render(<ExameForm />);
    const textarea = screen.getByLabelText(/Exames solicitados/);
    expect(textarea).toBeRequired();
  });

  it("renderiza botão Salvar alterações no modo edição", () => {
    render(<ExameForm defaults={{ id: "ex-1", paciente_id: "p-1", paciente_nome: "Maria" }} />);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para exame quando editando", () => {
    render(<ExameForm defaults={{ id: "ex-1" }} />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/exames/ex-1");
  });

  it("usa cancelHref customizado quando fornecido", () => {
    render(<ExameForm cancelHref="/pacientes/p-1" />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar exame." };
    render(<ExameForm />);
    expect(screen.getByText("Erro ao salvar exame.")).toBeInTheDocument();
  });

  it("exibe erro de campo quando fieldErrors está definido", () => {
    formState.current = { fieldErrors: { paciente_id: "Selecione um paciente." } };
    render(<ExameForm />);
    expect(screen.getByText("Selecione um paciente.")).toBeInTheDocument();
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<ExameForm />);
    const button = screen.getByRole("button", { name: /Salvar solicitação/ });
    expect(button).toBeDisabled();
  });

  it("campo exames tem maxLength", () => {
    render(<ExameForm />);
    const textarea = screen.getByLabelText(/Exames solicitados/) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(5000);
  });

  it("campo indicação clínica tem maxLength", () => {
    render(<ExameForm />);
    const textarea = screen.getByLabelText(/Indicação clínica/) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(2000);
  });

  it("campo observações tem maxLength", () => {
    render(<ExameForm />);
    const textarea = screen.getByLabelText("Observações") as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(1000);
  });

  it("campo data tem max igual a hoje", () => {
    render(<ExameForm />);
    const input = screen.getByLabelText(/Data/) as HTMLInputElement;
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    expect(input.max).toBe(today);
  });

  it("preenche defaults no modo edição", () => {
    render(
      <ExameForm
        defaults={{
          id: "ex-1",
          paciente_id: "p-1",
          paciente_nome: "Maria Silva",
          data: "2024-06-15",
          exames: "- Hemograma",
          indicacao_clinica: "Rotina",
          observacoes: "Jejum 12h",
        }}
      />
    );
    expect(screen.getByLabelText(/Data/)).toHaveValue("2024-06-15");
    expect(screen.getByLabelText(/Exames solicitados/)).toHaveValue("- Hemograma");
    expect(screen.getByLabelText(/Indicação clínica/)).toHaveValue("Rotina");
    expect(screen.getByLabelText("Observações")).toHaveValue("Jejum 12h");
  });
});
