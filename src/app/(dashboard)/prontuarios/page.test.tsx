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

vi.mock("@/lib/clinica", () => ({
  getMedicoId: vi.fn().mockResolvedValue("doc-1"),
}));

vi.mock("@/components/search-input", () => ({
  SearchInput: ({ defaultValue }: { defaultValue?: string }) => (
    <input data-testid="search-input" defaultValue={defaultValue} />
  ),
}));

vi.mock("@/components/pagination", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("@/components/sort-select", () => ({
  SortSelect: () => <div data-testid="sort-select" />,
}));

vi.mock("./filters", () => ({
  ProntuarioFilters: () => <div data-testid="filters" />,
}));

vi.mock("./types", async () => {
  const actual = await vi.importActual("./types");
  return { ...actual };
});

const mockData: { data: unknown[] | null; count: number } = { data: [], count: 0 };

function createQueryResult() {
  const result = {
    then: (resolve: (value: typeof mockData) => void) => resolve(mockData),
    or: () => createQueryResult(),
    order: () => createQueryResult(),
    limit: () => createQueryResult(),
    range: () => createQueryResult(),
    eq: () => createQueryResult(),
  };
  return result;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({ select: () => createQueryResult() }),
    }),
}));

import ProntuariosPage from "./page";

const prontuariosMock = [
  {
    id: "pr-1",
    data: "2024-06-15",
    tipo: "consulta",
    queixa_principal: "Dor de garganta há 3 dias",
    pacientes: { id: "p-1", nome: "Maria Silva" },
  },
  {
    id: "pr-2",
    data: "2024-06-14",
    tipo: null,
    queixa_principal: null,
    pacientes: { id: "p-2", nome: "João Santos" },
  },
];

async function renderPage(searchParams: { q?: string } = {}) {
  const jsx = await ProntuariosPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("ProntuariosPage", () => {
  beforeEach(() => {
    mockData.data = [];
    mockData.count = 0;
  });

  it("renderiza o título Prontuários", async () => {
    await renderPage();
    expect(screen.getByText("Prontuários")).toBeInTheDocument();
  });

  it("renderiza o botão Nova evolução com link correto", async () => {
    await renderPage();
    const links = screen.getAllByText("Nova evolução");
    expect(links[0].closest("a")).toHaveAttribute("href", "/prontuarios/novo");
  });

  it("renderiza o SearchInput", async () => {
    await renderPage();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há prontuários", async () => {
    await renderPage();
    expect(screen.getByText("Nenhum prontuário encontrado")).toBeInTheDocument();
    expect(screen.getByText("Registre a primeira evolução clínica.")).toBeInTheDocument();
  });

  it("mostra mensagem diferente no estado vazio quando há busca", async () => {
    await renderPage({ q: "xyz" });
    expect(screen.getByText("Tente buscar com outros termos.")).toBeInTheDocument();
  });

  it("renderiza lista de prontuários", async () => {
    mockData.data = prontuariosMock;
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("João Santos")).toBeInTheDocument();
  });

  it("exibe contagem de registros", async () => {
    mockData.data = prontuariosMock;
    mockData.count = 2;
    await renderPage();
    expect(screen.getByText("2 registros")).toBeInTheDocument();
  });

  it("exibe tipo quando disponível", async () => {
    mockData.data = prontuariosMock;
    await renderPage();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
  });

  it("exibe queixa principal como preview", async () => {
    mockData.data = prontuariosMock;
    await renderPage();
    expect(screen.getByText("Dor de garganta há 3 dias")).toBeInTheDocument();
  });

  it("exibe iniciais dos pacientes", async () => {
    mockData.data = prontuariosMock;
    await renderPage();
    expect(screen.getByText("MS")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("link do prontuário aponta para detalhes", async () => {
    mockData.data = [prontuariosMock[0]];
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios/pr-1");
  });

  it("exibe valor raw quando tipo não está em TIPO_LABELS", async () => {
    mockData.data = [{ ...prontuariosMock[0], tipo: "tipo_desconhecido" }];
    await renderPage();
    expect(screen.getByText("tipo_desconhecido")).toBeInTheDocument();
  });

  it("lida com prontuarios null do Supabase", async () => {
    mockData.data = null;
    await renderPage();
    expect(screen.getByText("Nenhum prontuário encontrado")).toBeInTheDocument();
  });
});
