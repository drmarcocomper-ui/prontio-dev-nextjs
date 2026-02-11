import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./print-button", () => ({
  PrintButton: () => <button data-testid="print-button">Imprimir</button>,
}));

const mockTransacoes: { data: unknown[] | null } = { data: [] };
const mockConfigs: { data: unknown[] | null } = { data: [] };

function createQueryResult(mockRef: { data: unknown[] | null }) {
  const result = {
    then: (resolve: (value: typeof mockRef) => void) => resolve(mockRef),
    eq: () => createQueryResult(mockRef),
    gte: () => createQueryResult(mockRef),
    lte: () => createQueryResult(mockRef),
    order: () => createQueryResult(mockRef),
    in: () => createQueryResult(mockRef),
  };
  return result;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => ({
        select: () => {
          if (table === "transacoes") {
            return createQueryResult(mockTransacoes);
          }
          return createQueryResult(mockConfigs);
        },
      }),
    }),
}));

import ImprimirRelatorioPage from "./page";

const transacoesMock = [
  {
    id: "t-1",
    tipo: "receita",
    categoria: "consulta",
    descricao: "Consulta particular",
    valor: 350,
    data: "2024-06-15",
    paciente_id: "p-1",
    forma_pagamento: "pix",
    status: "pago",
    observacoes: null,
    created_at: "2024-06-15T10:00:00Z",
    pacientes: { nome: "Maria Silva" },
  },
  {
    id: "t-2",
    tipo: "despesa",
    categoria: "material",
    descricao: "Material de escritório",
    valor: 120,
    data: "2024-06-14",
    paciente_id: null,
    forma_pagamento: "cartao_credito",
    status: "pendente",
    observacoes: null,
    created_at: "2024-06-14T09:00:00Z",
    pacientes: null,
  },
];

const configsMock = [
  { chave: "nome_consultorio", valor: "Clínica Saúde Total" },
  { chave: "endereco_consultorio", valor: "Rua das Flores, 123" },
  { chave: "telefone_consultorio", valor: "(11) 3456-7890" },
];

async function renderPage(searchParams: { mes?: string } = {}) {
  const jsx = await ImprimirRelatorioPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("ImprimirRelatorioPage", () => {
  beforeEach(() => {
    mockTransacoes.data = [];
    mockConfigs.data = [];
  });

  it("renderiza o título Relatório Financeiro", async () => {
    await renderPage();
    expect(screen.getByText("Relatório Financeiro")).toBeInTheDocument();
  });

  it("renderiza header do consultório quando configurado", async () => {
    mockConfigs.data = configsMock;
    await renderPage();
    expect(screen.getByText("Clínica Saúde Total")).toBeInTheDocument();
    expect(screen.getByText("Rua das Flores, 123")).toBeInTheDocument();
    expect(screen.getByText("Tel: (11) 3456-7890")).toBeInTheDocument();
  });

  it("renderiza o botão Imprimir", async () => {
    await renderPage();
    expect(screen.getByTestId("print-button")).toBeInTheDocument();
  });

  it("renderiza link Voltar para relatório", async () => {
    await renderPage({ mes: "2024-06" });
    const link = screen.getByText("Voltar para relatório");
    expect(link.closest("a")).toHaveAttribute("href", "/relatorios/financeiro?mes=2024-06");
  });

  it("renderiza KPIs com dados", async () => {
    mockTransacoes.data = transacoesMock;
    await renderPage();
    // Use getAllByText since "Receitas" appears in KPIs and potentially breakdown
    expect(screen.getAllByText("Receitas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Despesas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Saldo").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Transações").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza transações na tabela", async () => {
    mockTransacoes.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Consulta particular")).toBeInTheDocument();
    expect(screen.getByText("Material de escritório")).toBeInTheDocument();
  });

  it("mostra mensagem de vazio quando não há transações", async () => {
    await renderPage();
    expect(screen.getByText("Nenhuma transação neste período.")).toBeInTheDocument();
  });

  it("contém estilo @media print", async () => {
    await renderPage();
    const style = document.querySelector("style");
    expect(style?.textContent).toContain("@media print");
    expect(style?.textContent).toContain(".no-print");
  });

  it("renderiza breakdown por categoria com dados", async () => {
    mockTransacoes.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Por categoria")).toBeInTheDocument();
  });

  it("renderiza breakdown por forma de pagamento com dados", async () => {
    mockTransacoes.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Por forma de pagamento")).toBeInTheDocument();
  });
});
