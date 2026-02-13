import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./print-button", () => ({
  PrintButton: () => <button data-testid="print-button">Imprimir</button>,
}));

vi.mock("../utils", async () => {
  const actual = await vi.importActual("../utils");
  return { ...actual };
});

vi.mock("../../../financeiro/constants", async () => {
  const actual = await vi.importActual("../../../financeiro/constants");
  return { ...actual };
});

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "medico",
    userId: "user-1",
  }),
}));

const mockTransacoes: { data: unknown[] | null } = { data: [] };
let mockClinica: { data: { nome: string; endereco: string | null; telefone: string | null } | null } = { data: null };

function createQueryResult(mockRef: { data: unknown }) {
  const result = {
    then: (resolve: (value: typeof mockRef) => void) => resolve(mockRef),
    eq: () => createQueryResult(mockRef),
    gte: () => createQueryResult(mockRef),
    lte: () => createQueryResult(mockRef),
    order: () => createQueryResult(mockRef),
    in: () => createQueryResult(mockRef),
    single: () => Promise.resolve(mockRef),
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
          return createQueryResult(mockClinica);
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

async function renderPage(searchParams: { mes?: string } = {}) {
  const jsx = await ImprimirRelatorioPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("ImprimirRelatorioPage", () => {
  beforeEach(() => {
    mockTransacoes.data = [];
    mockClinica = { data: null };
  });

  it("renderiza o título Relatório Financeiro", async () => {
    await renderPage();
    expect(screen.getByText("Relatório Financeiro")).toBeInTheDocument();
  });

  it("renderiza header do consultório quando configurado", async () => {
    mockClinica = { data: { nome: "Clínica Saúde Total", endereco: "Rua das Flores, 123", telefone: "(11) 3456-7890" } };
    await renderPage();
    expect(screen.getByText("Clínica Saúde Total")).toBeInTheDocument();
    expect(screen.getByText("Rua das Flores, 123")).toBeInTheDocument();
    expect(screen.getByText("Tel: (11) 3456-7890")).toBeInTheDocument();
  });

  it("renderiza o botão Imprimir", async () => {
    await renderPage();
    expect(screen.getByTestId("print-button")).toBeInTheDocument();
  });

  it("renderiza breadcrumb com link para relatório financeiro", async () => {
    await renderPage({ mes: "2024-06" });
    const link = screen.getByText("Financeiro").closest("a");
    expect(link).toHaveAttribute("href", "/relatorios/financeiro?mes=2024-06");
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
