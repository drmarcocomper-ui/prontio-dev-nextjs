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
    render(<ProntuarioForm />);
    expect(screen.getByText(/Paciente/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByText(/Evolução/)).toBeInTheDocument();
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
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    expect(input).toHaveValue(today);
  });

  it("campo data tem max igual a hoje", () => {
    render(<ProntuarioForm />);
    const input = screen.getByLabelText(/Data/) as HTMLInputElement;
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    expect(input.max).toBe(today);
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

  it("textarea evolução tem maxLength definido", () => {
    render(<ProntuarioForm />);
    const evolucao = screen.getByLabelText(/Evolução/) as HTMLTextAreaElement;
    expect(evolucao.maxLength).toBe(5000);
  });

  it("renderiza botão Salvar alterações no modo edição", () => {
    render(<ProntuarioForm defaults={{ id: "pr-1", paciente_id: "p-1", paciente_nome: "Maria" }} />);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para prontuário quando editando", () => {
    render(<ProntuarioForm defaults={{ id: "pr-1" }} />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios/pr-1");
  });

  it("usa cancelHref customizado quando fornecido", () => {
    render(<ProntuarioForm cancelHref="/pacientes/p-1" />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar prontuário." };
    render(<ProntuarioForm />);
    expect(screen.getByText("Erro ao salvar prontuário.")).toBeInTheDocument();
  });

  it("exibe erro de campo quando fieldErrors está definido", () => {
    formState.current = { fieldErrors: { paciente_id: "Selecione um paciente." } };
    render(<ProntuarioForm />);
    expect(screen.getByText("Selecione um paciente.")).toBeInTheDocument();
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<ProntuarioForm />);
    const button = screen.getByRole("button", { name: /Salvar prontuário/ });
    expect(button).toBeDisabled();
  });

  it("inclui input hidden com id no modo edição", () => {
    render(<ProntuarioForm defaults={{ id: "pr-1" }} />);
    const hidden = document.querySelector('input[name="id"]') as HTMLInputElement;
    expect(hidden).toBeInTheDocument();
    expect(hidden.value).toBe("pr-1");
  });

  it("desabilita select tipo quando tipo vem da agenda", () => {
    render(<ProntuarioForm defaults={{ paciente_id: "p-1", tipo: "consulta" }} />);
    const select = screen.getByLabelText("Tipo") as HTMLSelectElement;
    expect(select).toBeDisabled();
    expect(select.value).toBe("consulta");
    const hidden = document.querySelector('input[type="hidden"][name="tipo"]') as HTMLInputElement;
    expect(hidden).toBeInTheDocument();
    expect(hidden.value).toBe("consulta");
  });

  it("mantém select tipo editável quando tipo não é pré-definido", () => {
    render(<ProntuarioForm />);
    const select = screen.getByLabelText("Tipo") as HTMLSelectElement;
    expect(select).not.toBeDisabled();
    expect(select.name).toBe("tipo");
  });

  it("renderiza botão 'Salvar como template'", () => {
    render(<ProntuarioForm />);
    expect(screen.getByText("Salvar como template")).toBeInTheDocument();
  });

  it("carrega seed templates quando não há templates existentes", () => {
    const seeds = [
      { id: "s1", nome: "Template 1", texto: "Texto 1" },
      { id: "s2", nome: "Template 2", texto: "Texto 2" },
    ];
    render(<ProntuarioForm userId="user-1" seedTemplates={seeds} />);
    expect(screen.getByText("Template 1")).toBeInTheDocument();
    expect(screen.getByText("Template 2")).toBeInTheDocument();
  });

  it("não carrega seed templates se já foi semeado anteriormente", () => {
    localStorage.setItem("prontio_anamnese_seeded_user-2", "1");
    const seeds = [{ id: "s1", nome: "Seed", texto: "Texto" }];
    render(<ProntuarioForm userId="user-2" seedTemplates={seeds} />);
    expect(screen.queryByText("Seed")).not.toBeInTheDocument();
    localStorage.removeItem("prontio_anamnese_seeded_user-2");
  });

  it("usa chave de localStorage por userId", () => {
    localStorage.setItem(
      "prontio_anamnese_templates_user-3",
      JSON.stringify([{ id: "t1", nome: "Meu Template", texto: "Texto" }])
    );
    render(<ProntuarioForm userId="user-3" />);
    expect(screen.getByText("Meu Template")).toBeInTheDocument();
    localStorage.removeItem("prontio_anamnese_templates_user-3");
  });
});
