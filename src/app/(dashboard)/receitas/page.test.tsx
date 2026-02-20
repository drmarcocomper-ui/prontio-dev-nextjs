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

const mockGetClinicaAtual = vi.fn().mockResolvedValue({
  clinicaId: "clinic-1",
  clinicaNome: "Clínica Teste",
  papel: "profissional_saude",
  userId: "doc-1",
});

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: (...args: unknown[]) => mockGetClinicaAtual(...args),
}));

vi.mock("./types", async () => {
  const actual = await vi.importActual("./types");
  return { ...actual };
});

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
  ReceitaFilters: () => <div data-testid="filters" />,
}));

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

import ReceitasPage from "./page";

const receitasMock = [
  {
    id: "rec-1",
    data: "2024-06-15",
    tipo: "simples",
    medicamentos: "Amoxicilina 500mg 8/8h por 7 dias",
    observacoes: null,
    created_at: "2024-06-15T10:00:00Z",
    pacientes: { id: "p-1", nome: "Maria Silva" },
  },
  {
    id: "rec-2",
    data: "2024-06-14",
    tipo: "controle_especial",
    medicamentos: "Ritalina 10mg 1x ao dia",
    observacoes: "Uso contínuo",
    created_at: "2024-06-14T09:00:00Z",
    pacientes: { id: "p-2", nome: "João Santos" },
  },
];

async function renderPage(searchParams: { q?: string } = {}) {
  const jsx = await ReceitasPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("ReceitasPage", () => {
  beforeEach(() => {
    mockData.data = [];
    mockData.count = 0;
    mockGetClinicaAtual.mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "doc-1" });
  });

  it("renderiza o título Receitas", async () => {
    await renderPage();
    expect(screen.getByText("Receitas")).toBeInTheDocument();
  });

  it("renderiza o botão Nova receita com link correto", async () => {
    await renderPage();
    const links = screen.getAllByText("Nova receita");
    expect(links[0].closest("a")).toHaveAttribute("href", "/receitas/novo");
  });

  it("renderiza o SearchInput", async () => {
    await renderPage();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há receitas", async () => {
    await renderPage();
    expect(screen.getByText("Nenhuma receita encontrada")).toBeInTheDocument();
    expect(screen.getByText("Emita a primeira receita médica.")).toBeInTheDocument();
  });

  it("mostra mensagem diferente no estado vazio quando há busca", async () => {
    await renderPage({ q: "xyz" });
    expect(screen.getByText("Tente buscar com outros termos.")).toBeInTheDocument();
  });

  it("renderiza lista de receitas", async () => {
    mockData.data = receitasMock;
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("João Santos")).toBeInTheDocument();
  });

  it("exibe contagem de registros", async () => {
    mockData.data = receitasMock;
    mockData.count = 2;
    await renderPage();
    expect(screen.getByText("2 registros")).toBeInTheDocument();
  });

  it("exibe tipo como badge", async () => {
    mockData.data = receitasMock;
    await renderPage();
    expect(screen.getByText("Simples")).toBeInTheDocument();
    expect(screen.getByText("Controle Especial")).toBeInTheDocument();
  });

  it("exibe preview dos medicamentos", async () => {
    mockData.data = receitasMock;
    await renderPage();
    expect(screen.getByText("Amoxicilina 500mg 8/8h por 7 dias")).toBeInTheDocument();
  });

  it("exibe iniciais dos pacientes", async () => {
    mockData.data = receitasMock;
    await renderPage();
    expect(screen.getByText("MS")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("link da receita aponta para detalhes", async () => {
    mockData.data = [receitasMock[0]];
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/receitas/rec-1");
  });

  it("exibe tipo bruto quando não encontrado em TIPO_LABELS", async () => {
    mockData.data = [{ ...receitasMock[0], tipo: "desconhecido" }];
    await renderPage();
    expect(screen.getByText("desconhecido")).toBeInTheDocument();
  });

  it("lida com receitas null do Supabase", async () => {
    mockData.data = null;
    await renderPage();
    expect(screen.getByText("Nenhuma receita encontrada")).toBeInTheDocument();
  });
});
