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

vi.mock("./filters", () => ({
  Filters: () => <div data-testid="filters" />,
}));

vi.mock("@/components/pagination", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("@/components/sortable-header", () => ({
  SortableHeader: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
}));

vi.mock("./constants", async () => {
  const actual = await vi.importActual("./constants");
  return { ...actual };
});

vi.mock("@/components/delete-button", () => ({
  DeleteButton: ({ title }: { title: string }) => (
    <button data-testid="delete-button" data-title={title}>Excluir</button>
  ),
}));

const mockData: { data: unknown[] | null } = { data: [] };

function createQueryResult() {
  const result = {
    then: (resolve: (value: typeof mockData) => void) => resolve(mockData),
    eq: () => createQueryResult(),
    gte: () => createQueryResult(),
    lte: () => createQueryResult(),
    order: () => createQueryResult(),
    range: () => createQueryResult(),
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

import FinanceiroPage from "./page";

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

async function renderPage(searchParams: { mes?: string; tipo?: string } = {}) {
  const jsx = await FinanceiroPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("FinanceiroPage", () => {
  beforeEach(() => {
    mockData.data = [];
  });

  it("renderiza o título Financeiro", async () => {
    await renderPage();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
  });

  it("renderiza o botão Nova transação", async () => {
    await renderPage();
    const links = screen.getAllByText("Nova transação");
    expect(links[0].closest("a")).toHaveAttribute("href", "/financeiro/novo");
  });

  it("renderiza os cards de resumo", async () => {
    await renderPage();
    expect(screen.getByText("Receitas")).toBeInTheDocument();
    expect(screen.getByText("Despesas")).toBeInTheDocument();
    expect(screen.getByText("Saldo")).toBeInTheDocument();
  });

  it("renderiza o Filters", async () => {
    await renderPage();
    expect(screen.getByTestId("filters")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há transações", async () => {
    await renderPage();
    expect(screen.getByText("Nenhuma transação neste período")).toBeInTheDocument();
    expect(screen.getByText("Registre uma receita ou despesa para começar.")).toBeInTheDocument();
  });

  it("renderiza tabela com transações", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getAllByText("Consulta particular").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Material de escritório").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe nome do paciente quando disponível", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });

  it("exibe categoria e forma de pagamento", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getAllByText("Consulta").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("PIX").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Material").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Cartão de crédito").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe status das transações", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getAllByText("Pago").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pendente").length).toBeGreaterThanOrEqual(1);
  });

  it("calcula e exibe totais corretamente", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getAllByText("R$ 350,00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("R$ 120,00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("R$ 230,00")).toBeInTheDocument();
  });

  it("renderiza DeleteButton para cada transação", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    const buttons = screen.getAllByTestId("delete-button");
    expect(buttons).toHaveLength(2);
  });

  it("aceita filtro por tipo via searchParams", async () => {
    mockData.data = transacoesMock;
    await renderPage({ tipo: "receita" });
    expect(screen.getAllByText("Consulta particular").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe traço quando categoria é null", async () => {
    mockData.data = [{ ...transacoesMock[0], categoria: null, forma_pagamento: null }];
    await renderPage();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(2);
  });

  it("exibe saldo negativo em vermelho", async () => {
    mockData.data = [{ ...transacoesMock[1], valor: 500 }];
    await renderPage();
    expect(screen.getByText("-R$ 500,00")).toBeInTheDocument();
  });

  it("exibe valor raw quando categoria não está em CATEGORIA_LABELS", async () => {
    mockData.data = [{ ...transacoesMock[0], categoria: "cat_desconhecida", forma_pagamento: "pagamento_desconhecido" }];
    await renderPage();
    expect(screen.getAllByText("cat_desconhecida").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("pagamento_desconhecido").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe status Cancelado para transação cancelada", async () => {
    mockData.data = [{ ...transacoesMock[0], status: "cancelado" }];
    await renderPage();
    expect(screen.getAllByText("Cancelado").length).toBeGreaterThanOrEqual(1);
  });

  it("lida com transacoes null do Supabase", async () => {
    mockData.data = null;
    await renderPage();
    expect(screen.getByText("Nenhuma transação neste período")).toBeInTheDocument();
  });

  it("usa estilo padrão quando status não está em STATUS_STYLES", async () => {
    mockData.data = [{ ...transacoesMock[0], status: "desconhecido" }];
    await renderPage();
    expect(screen.getAllByText("desconhecido").length).toBeGreaterThanOrEqual(1);
  });
});
