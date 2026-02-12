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

vi.mock("./constants", async () => {
  const actual = await vi.importActual("./constants");
  return { ...actual };
});

vi.mock("./delete-button", () => ({
  DeleteButton: ({ transacaoId }: { transacaoId: string }) => (
    <button data-testid={`delete-${transacaoId}`}>Excluir</button>
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
  };
  return result;
}

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
    expect(screen.getByText("Consulta particular")).toBeInTheDocument();
    expect(screen.getByText("Material de escritório")).toBeInTheDocument();
  });

  it("exibe nome do paciente quando disponível", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });

  it("exibe categoria e forma de pagamento", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("PIX")).toBeInTheDocument();
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Cartão de crédito")).toBeInTheDocument();
  });

  it("exibe status das transações", async () => {
    mockData.data = transacoesMock;
    await renderPage();
    expect(screen.getByText("Pago")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
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
    expect(screen.getByTestId("delete-t-1")).toBeInTheDocument();
    expect(screen.getByTestId("delete-t-2")).toBeInTheDocument();
  });

  it("aceita filtro por tipo via searchParams", async () => {
    mockData.data = transacoesMock;
    await renderPage({ tipo: "receita" });
    expect(screen.getByText("Consulta particular")).toBeInTheDocument();
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
    expect(screen.getByText("cat_desconhecida")).toBeInTheDocument();
    expect(screen.getByText("pagamento_desconhecido")).toBeInTheDocument();
  });

  it("exibe status Cancelado para transação cancelada", async () => {
    mockData.data = [{ ...transacoesMock[0], status: "cancelado" }];
    await renderPage();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("lida com transacoes null do Supabase", async () => {
    mockData.data = null;
    await renderPage();
    expect(screen.getByText("Nenhuma transação neste período")).toBeInTheDocument();
  });

  it("usa estilo padrão quando status não está em STATUS_STYLES", async () => {
    mockData.data = [{ ...transacoesMock[0], status: "desconhecido" }];
    await renderPage();
    expect(screen.getByText("desconhecido")).toBeInTheDocument();
  });
});
