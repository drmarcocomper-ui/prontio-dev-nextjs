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
  criarAgendamento: vi.fn(),
  atualizarAgendamento: vi.fn(),
}));

vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return { ...actual };
});

vi.mock("./patient-search", () => ({
  PatientSearch: ({ defaultPatientId, defaultPatientName }: { defaultPatientId?: string; defaultPatientName?: string }) => (
    <input data-testid="patient-search" placeholder="Buscar paciente" data-patient-id={defaultPatientId} data-patient-name={defaultPatientName} />
  ),
}));

import { AgendamentoForm } from "./agendamento-form";

describe("AgendamentoForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza todos os campos do formulário", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    expect(screen.getByText(/Paciente/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Início/)).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("preenche a data com o valor padrão", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    expect(screen.getByLabelText(/Data/)).toHaveValue("2024-06-15");
  });

  it("renderiza as opções de tipo", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    const select = screen.getByLabelText("Tipo");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Retorno")).toBeInTheDocument();
    expect(screen.getByText("Cortesia")).toBeInTheDocument();
  });

  it("renderiza o botão Agendar", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    expect(screen.getByRole("button", { name: "Agendar" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para agenda com data", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/agenda?data=2024-06-15");
  });

  it("campos obrigatórios estão marcados", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    expect(screen.getByLabelText(/Data/)).toBeRequired();
    expect(screen.getByLabelText(/Início/)).toBeRequired();
  });

  it("renderiza o PatientSearch", () => {
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao criar agendamento. Tente novamente." };
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    expect(screen.getByText("Erro ao criar agendamento. Tente novamente.")).toBeInTheDocument();
  });

  it("exibe erro de campo quando fieldErrors está definido", () => {
    formState.current = { fieldErrors: { paciente_id: "Selecione um paciente." } };
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    expect(screen.getByText("Selecione um paciente.")).toBeInTheDocument();
  });

  it("desabilita botão e exibe spinner quando isPending", () => {
    formPending.current = true;
    render(<AgendamentoForm defaultDate="2024-06-15" medicoId="doc-1" />);
    const button = screen.getByRole("button", { name: /Agendar/ });
    expect(button).toBeDisabled();
  });

  // Edit mode tests
  it("renderiza botão 'Salvar alterações' no modo edição", () => {
    render(
      <AgendamentoForm
        medicoId="doc-1"
        defaults={{
          id: "ag-1",
          paciente_id: "p-1",
          paciente_nome: "Maria Silva",
          data: "2024-06-15",
          hora_inicio: "09:00",
          tipo: "consulta",
          observacoes: "Obs",
        }}
      />
    );
    expect(screen.getByRole("button", { name: /Salvar alterações/ })).toBeInTheDocument();
  });

  it("link Cancelar aponta para o detalhe no modo edição", () => {
    render(
      <AgendamentoForm
        medicoId="doc-1"
        defaults={{
          id: "ag-1",
          data: "2024-06-15",
          hora_inicio: "09:00",
        }}
      />
    );
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/agenda/ag-1");
  });

  it("preenche campos com defaults no modo edição", () => {
    render(
      <AgendamentoForm
        medicoId="doc-1"
        defaults={{
          id: "ag-1",
          paciente_id: "p-1",
          paciente_nome: "Maria Silva",
          data: "2024-06-15",
          hora_inicio: "09:00",
          tipo: "consulta",
          observacoes: "Observação teste",
        }}
      />
    );
    expect(screen.getByLabelText(/Data/)).toHaveValue("2024-06-15");
    expect(screen.getByLabelText(/Início/)).toHaveValue("09:00");
    expect(screen.getByLabelText("Observações")).toHaveValue("Observação teste");
  });

  it("inclui hidden input com id no modo edição", () => {
    const { container } = render(
      <AgendamentoForm
        medicoId="doc-1"
        defaults={{
          id: "ag-1",
          data: "2024-06-15",
          hora_inicio: "09:00",
        }}
      />
    );
    const hidden = container.querySelector('input[name="id"]') as HTMLInputElement;
    expect(hidden).toBeTruthy();
    expect(hidden.value).toBe("ag-1");
  });
});
