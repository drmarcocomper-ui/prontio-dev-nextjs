import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  criarTransacao: vi.fn(),
  atualizarTransacao: vi.fn(),
}));

vi.mock("../constants", async () => {
  const actual = await vi.importActual("../constants");
  return { ...actual };
});

vi.mock("@/app/(dashboard)/agenda/novo/patient-search", () => ({
  PatientSearch: ({ defaultPatientId, defaultPatientName }: { defaultPatientId?: string; defaultPatientName?: string }) => (
    <input data-testid="patient-search" data-patient-id={defaultPatientId} data-patient-name={defaultPatientName} />
  ),
}));

import { TransacaoForm } from "./transacao-form";

describe("TransacaoForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza os radio buttons de tipo", () => {
    render(<TransacaoForm medicoId="doc-1" />);
    expect(screen.getByText("Receita")).toBeInTheDocument();
    expect(screen.getByText("Despesa")).toBeInTheDocument();
  });

  it("renderiza os campos do formulário", () => {
    render(<TransacaoForm medicoId="doc-1" />);
    expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/)).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
    expect(screen.getByLabelText("Forma de pagamento")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("campos obrigatórios estão marcados", () => {
    render(<TransacaoForm medicoId="doc-1" />);
    expect(screen.getByLabelText(/Descrição/)).toBeRequired();
    expect(screen.getByLabelText(/Valor/)).toBeRequired();
    expect(screen.getByLabelText(/Data/)).toBeRequired();
  });

  it("exibe categorias de receita por padrão", () => {
    render(<TransacaoForm medicoId="doc-1" />);
    const select = screen.getByLabelText("Categoria");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Procedimento")).toBeInTheDocument();
  });

  it("muda categorias ao selecionar despesa", async () => {
    render(<TransacaoForm medicoId="doc-1" />);
    await userEvent.click(screen.getByText("Despesa"));
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.getByText("Equipamento")).toBeInTheDocument();
  });

  it("exibe PatientSearch apenas para receita", async () => {
    render(<TransacaoForm medicoId="doc-1" />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Despesa"));
    expect(screen.queryByTestId("patient-search")).not.toBeInTheDocument();
  });

  it("volta para categorias de receita ao clicar em Receita após Despesa", async () => {
    render(<TransacaoForm medicoId="doc-1" />);
    await userEvent.click(screen.getByText("Despesa"));
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Receita"));
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });

  it("renderiza o botão Registrar", () => {
    render(<TransacaoForm medicoId="doc-1" />);
    expect(screen.getByRole("button", { name: "Registrar" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para /financeiro", () => {
    render(<TransacaoForm medicoId="doc-1" />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro");
  });

  it("aplica máscara de moeda ao digitar", async () => {
    render(<TransacaoForm medicoId="doc-1" />);
    const input = screen.getByLabelText(/Valor/);
    await userEvent.type(input, "35000");
    expect(input).toHaveValue("350,00");
  });

  it("máscara de moeda retorna vazio para entrada sem dígitos", async () => {
    render(<TransacaoForm medicoId="doc-1" />);
    const input = screen.getByLabelText(/Valor/) as HTMLInputElement;
    await userEvent.type(input, "abc");
    expect(input.value).toBe("");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao registrar transação." };
    render(<TransacaoForm medicoId="doc-1" />);
    expect(screen.getByText("Erro ao registrar transação.")).toBeInTheDocument();
  });

  it("exibe erro de campo quando fieldErrors está definido", () => {
    formState.current = { fieldErrors: { descricao: "Descrição é obrigatória." } };
    render(<TransacaoForm medicoId="doc-1" />);
    expect(screen.getByText("Descrição é obrigatória.")).toBeInTheDocument();
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<TransacaoForm medicoId="doc-1" />);
    const button = screen.getByRole("button", { name: /Registrar/ });
    expect(button).toBeDisabled();
  });

  // Edit mode tests
  it("renderiza botão 'Salvar alterações' no modo edição", () => {
    render(
      <TransacaoForm
        medicoId="doc-1"
        defaults={{
          id: "t-1",
          tipo: "receita",
          descricao: "Consulta",
          valor: "350,00",
          data: "2024-06-15",
        }}
      />
    );
    expect(screen.getByRole("button", { name: /Salvar alterações/ })).toBeInTheDocument();
  });

  it("link Cancelar aponta para o detalhe no modo edição", () => {
    render(
      <TransacaoForm
        medicoId="doc-1"
        defaults={{
          id: "t-1",
          tipo: "receita",
          descricao: "Consulta",
          valor: "350,00",
          data: "2024-06-15",
        }}
      />
    );
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro/t-1");
  });

  it("preenche campos com defaults no modo edição", () => {
    render(
      <TransacaoForm
        medicoId="doc-1"
        defaults={{
          id: "t-1",
          tipo: "receita",
          descricao: "Consulta particular",
          valor: "350,00",
          data: "2024-06-15",
          observacoes: "Obs teste",
        }}
      />
    );
    expect(screen.getByLabelText(/Descrição/)).toHaveValue("Consulta particular");
    expect(screen.getByLabelText(/Valor/)).toHaveValue("350,00");
    expect(screen.getByLabelText(/Data/)).toHaveValue("2024-06-15");
    expect(screen.getByLabelText("Observações")).toHaveValue("Obs teste");
  });

  it("inclui hidden input com id no modo edição", () => {
    const { container } = render(
      <TransacaoForm
        medicoId="doc-1"
        defaults={{
          id: "t-1",
          tipo: "receita",
          descricao: "Consulta",
          valor: "350,00",
          data: "2024-06-15",
        }}
      />
    );
    const hidden = container.querySelector('input[name="id"]') as HTMLInputElement;
    expect(hidden).toBeTruthy();
    expect(hidden.value).toBe("t-1");
  });

  it("campo descrição tem maxLength de 255", () => {
    render(<TransacaoForm medicoId="doc-1" />);
    const input = screen.getByLabelText(/Descrição/) as HTMLInputElement;
    expect(input.maxLength).toBe(255);
  });

  it("campo observações tem maxLength de 1000", () => {
    render(<TransacaoForm medicoId="doc-1" />);
    const textarea = screen.getByLabelText("Observações") as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(1000);
  });

  it("passa defaults de paciente para PatientSearch no modo edição", () => {
    render(
      <TransacaoForm
        medicoId="doc-1"
        defaults={{
          id: "t-1",
          tipo: "receita",
          descricao: "Consulta",
          valor: "350,00",
          data: "2024-06-15",
          paciente_id: "p-1",
          paciente_nome: "Maria Silva",
        }}
      />
    );
    const ps = screen.getByTestId("patient-search");
    expect(ps).toHaveAttribute("data-patient-id", "p-1");
    expect(ps).toHaveAttribute("data-patient-name", "Maria Silva");
  });
});
