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

vi.mock("./month-filter", () => ({
  MonthFilter: () => <div data-testid="month-filter" />,
}));

vi.mock("./export-csv-button", () => ({
  ExportCsvButton: () => <button data-testid="export-csv">Exportar CSV</button>,
}));

vi.mock("./utils", async () => {
  const actual = await vi.importActual("./utils");
  return { ...actual };
});

vi.mock("../../financeiro/constants", async () => {
  const actual = await vi.importActual("../../financeiro/constants");
  return { ...actual };
});

const mockData: { data: unknown[] | null } = { data: [] };

function createQueryResult() {
  const result = {
    then: (resolve: (value: typeof mockData) => void) => resolve(mockData),
    eq: () => createQueryResult(),
    gte: () => createQueryResult(),
    lte: () => createQueryResult(),
    order: () => createQueryResult(),
  };
  return result;
}

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "profissional_saude",
    userId: "user-1",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({ select: () => createQueryResult() }),
    }),
}));

import RelatorioFinanceiroPage from "./page";

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
  {
    id: "t-3",
    tipo: "receita",
    categoria: "consulta",
    descricao: "Retorno consulta",
    valor: 200,
    data: "2024-06-13",
    paciente_id: "p-2",
    forma_pagamento: "dinheiro",
    status: "pago",
    observacoes: null,
    created_at: "2024-06-13T08:00:00Z",
    pacientes: { nome: "João Santos" },
  },
];

async function renderPage(searchParams: { mes?: string } = {}) {
  const jsx = await RelatorioFinanceiroPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("RelatorioFinanceiroPage", () => {
  beforeEach(() => {
    mockData.data = [];
  });

  it("renderiza o título Relatório Financeiro", async () => {
    await renderPage();
    expect(screen.getByText("Relatório Financeiro")).toBeInTheDocument();
  });

  it("renderiza MonthFilter e botão Exportar CSV", async () => {
    await renderPage();
    expect(screen.getByTestId("month-filter")).toBeInTheDocument();
    expect(screen.getByTestId("export-csv")).toBeInTheDocument();
  });

  it("renderiza link Imprimir", async () => {
    await renderPage({ mes: "2024-06" });
    const link = screen.getByText("Imprimir").closest("a");
    expect(link).toHaveAttribute("href", "/relatorios/financeiro/imprimir?mes=2024-06");
  });

  it("renderiza os 4 KPI cards", async () => {
    await renderPage();
    expect(screen.getByText("Total Receitas")).toBeInTheDocument();
    expect(screen.getByText("Total Despesas")).toBeInTheDocument();
    expect(screen.getByText("Saldo")).toBeInTheDocument();
    expect(screen.getByText("Transações")).toBeInTheDocument();
  });

  it("calcula KPIs corretamente", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    // Total receitas = 350 + 200 = 550
    // Total despesas = 120
    // Saldo = 430
    // Count = 3
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renderiza breakdown por categoria", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Por categoria")).toBeInTheDocument();
  });

  it("renderiza breakdown por forma de pagamento", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Por forma de pagamento")).toBeInTheDocument();
  });

  it("renderiza lista de transações", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Transações do período")).toBeInTheDocument();
    expect(screen.getByText("Consulta particular")).toBeInTheDocument();
    expect(screen.getByText("Material de escritório")).toBeInTheDocument();
    expect(screen.getByText("Retorno consulta")).toBeInTheDocument();
  });

  it("exibe nomes de pacientes na lista", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("João Santos")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há transações", async () => {
    await renderPage();
    expect(screen.getByText("Nenhuma transação neste período")).toBeInTheDocument();
  });

  it("lida com transacoes null do Supabase", async () => {
    mockData.data = null;
    await renderPage();
    expect(screen.getByText("Nenhuma transação neste período")).toBeInTheDocument();
  });

  it("não exibe tabelas de breakdown quando não há dados", async () => {
    await renderPage();
    expect(screen.queryByText("Por categoria")).not.toBeInTheDocument();
    expect(screen.queryByText("Por forma de pagamento")).not.toBeInTheDocument();
  });

  it("exibe status das transações", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getAllByText("Pago").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pendente").length).toBeGreaterThanOrEqual(1);
  });
});
