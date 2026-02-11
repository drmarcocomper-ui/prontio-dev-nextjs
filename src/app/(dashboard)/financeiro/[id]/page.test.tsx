import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

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

const mockNotFound = vi.fn();
vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("./delete-button", () => ({
  DeleteButton: ({ transacaoId }: { transacaoId: string }) => (
    <button data-testid="delete-button" data-id={transacaoId}>Excluir</button>
  ),
}));

let mockTransacao: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockTransacao }),
          }),
        }),
      }),
    }),
}));

import TransacaoDetalhesPage from "./page";

const transacaoCompleta = {
  id: "t-1",
  tipo: "receita",
  categoria: "consulta",
  descricao: "Consulta particular",
  valor: 350,
  data: "2024-06-15",
  paciente_id: "p-1",
  forma_pagamento: "pix",
  status: "pago",
  observacoes: "Pagamento confirmado",
  created_at: "2024-06-15T10:00:00Z",
  pacientes: { id: "p-1", nome: "João Souza" },
};

async function renderPage(id = "t-1") {
  const jsx = await TransacaoDetalhesPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("TransacaoDetalhesPage", () => {
  beforeEach(() => {
    mockTransacao = transacaoCompleta;
    mockNotFound.mockClear();
  });

  it("chama notFound quando transação não existe", async () => {
    mockTransacao = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o breadcrumb para financeiro", async () => {
    await renderPage();
    const link = screen.getByText("Financeiro").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro");
  });

  it("renderiza a descrição da transação", async () => {
    await renderPage();
    expect(screen.getByText("Consulta particular")).toBeInTheDocument();
  });

  it("exibe badge de tipo receita", async () => {
    await renderPage();
    expect(screen.getByText("Receita")).toBeInTheDocument();
  });

  it("exibe badge de tipo despesa", async () => {
    mockTransacao = { ...transacaoCompleta, tipo: "despesa" };
    await renderPage();
    expect(screen.getByText("Despesa")).toBeInTheDocument();
  });

  it("exibe status Pago", async () => {
    await renderPage();
    expect(screen.getByText("Pago")).toBeInTheDocument();
  });

  it("exibe categoria", async () => {
    await renderPage();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
  });

  it("exibe forma de pagamento", async () => {
    await renderPage();
    expect(screen.getByText("PIX")).toBeInTheDocument();
  });

  it("exibe nome do paciente com link", async () => {
    await renderPage();
    const link = screen.getByText("João Souza").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });

  it("exibe observações", async () => {
    await renderPage();
    expect(screen.getByText("Pagamento confirmado")).toBeInTheDocument();
  });

  it("renderiza o DeleteButton", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-id", "t-1");
  });

  it("exibe link para editar", async () => {
    await renderPage();
    const link = screen.getByText("Editar").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro/t-1/editar");
  });

  it("não exibe paciente quando não há", async () => {
    mockTransacao = { ...transacaoCompleta, pacientes: null, paciente_id: null };
    await renderPage();
    expect(screen.queryByText("João Souza")).not.toBeInTheDocument();
  });
});
