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
}));

vi.mock("@/app/(dashboard)/agenda/novo/patient-search", () => ({
  PatientSearch: () => <input data-testid="patient-search" />,
}));

import { TransacaoForm } from "./transacao-form";

describe("TransacaoForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  it("renderiza os radio buttons de tipo", () => {
    render(<TransacaoForm />);
    expect(screen.getByText("Receita")).toBeInTheDocument();
    expect(screen.getByText("Despesa")).toBeInTheDocument();
  });

  it("renderiza os campos do formulário", () => {
    render(<TransacaoForm />);
    expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/)).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
    expect(screen.getByLabelText("Forma de pagamento")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações")).toBeInTheDocument();
  });

  it("campos obrigatórios estão marcados", () => {
    render(<TransacaoForm />);
    expect(screen.getByLabelText(/Descrição/)).toBeRequired();
    expect(screen.getByLabelText(/Valor/)).toBeRequired();
    expect(screen.getByLabelText(/Data/)).toBeRequired();
  });

  it("exibe categorias de receita por padrão", () => {
    render(<TransacaoForm />);
    const select = screen.getByLabelText("Categoria");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Procedimento")).toBeInTheDocument();
  });

  it("muda categorias ao selecionar despesa", async () => {
    render(<TransacaoForm />);
    await userEvent.click(screen.getByText("Despesa"));
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.getByText("Equipamento")).toBeInTheDocument();
  });

  it("exibe PatientSearch apenas para receita", async () => {
    render(<TransacaoForm />);
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Despesa"));
    expect(screen.queryByTestId("patient-search")).not.toBeInTheDocument();
  });

  it("volta para categorias de receita ao clicar em Receita após Despesa", async () => {
    render(<TransacaoForm />);
    await userEvent.click(screen.getByText("Despesa"));
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Receita"));
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByTestId("patient-search")).toBeInTheDocument();
  });

  it("renderiza o botão Registrar", () => {
    render(<TransacaoForm />);
    expect(screen.getByRole("button", { name: "Registrar" })).toBeInTheDocument();
  });

  it("link Cancelar aponta para /financeiro", () => {
    render(<TransacaoForm />);
    const link = screen.getByText("Cancelar").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro");
  });

  it("aplica máscara de moeda ao digitar", async () => {
    render(<TransacaoForm />);
    const input = screen.getByLabelText(/Valor/);
    await userEvent.type(input, "35000");
    expect(input).toHaveValue("350,00");
  });

  it("máscara de moeda retorna vazio para entrada sem dígitos", async () => {
    render(<TransacaoForm />);
    const input = screen.getByLabelText(/Valor/) as HTMLInputElement;
    await userEvent.type(input, "abc");
    expect(input.value).toBe("");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao registrar transação." };
    render(<TransacaoForm />);
    expect(screen.getByText("Erro ao registrar transação.")).toBeInTheDocument();
  });

  it("exibe erro de campo quando fieldErrors está definido", () => {
    formState.current = { fieldErrors: { descricao: "Descrição é obrigatória." } };
    render(<TransacaoForm />);
    expect(screen.getByText("Descrição é obrigatória.")).toBeInTheDocument();
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<TransacaoForm />);
    const button = screen.getByRole("button", { name: /Registrar/ });
    expect(button).toBeDisabled();
  });
});
