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

vi.mock("./search-input", () => ({
  SearchInput: ({ defaultValue }: { defaultValue?: string }) => (
    <input data-testid="search-input" defaultValue={defaultValue} />
  ),
}));

const mockData: { data: unknown[] | null } = { data: [] };

function createQueryResult() {
  const result = {
    then: (resolve: (value: typeof mockData) => void) => resolve(mockData),
    or: () => createQueryResult(),
    order: () => createQueryResult(),
    limit: () => createQueryResult(),
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
    cid: "J06.9",
    queixa_principal: "Dor de garganta há 3 dias",
    hipotese_diagnostica: "IVAS",
    conduta: "Amoxicilina 500mg",
    created_at: "2024-06-15T10:00:00Z",
    pacientes: { id: "p-1", nome: "Maria Silva" },
  },
  {
    id: "pr-2",
    data: "2024-06-14",
    tipo: null,
    cid: null,
    queixa_principal: null,
    hipotese_diagnostica: null,
    conduta: "Retorno em 15 dias",
    created_at: "2024-06-14T09:00:00Z",
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
    await renderPage();
    expect(screen.getByText("2 registros")).toBeInTheDocument();
  });

  it("exibe tipo e CID quando disponíveis", async () => {
    mockData.data = prontuariosMock;
    await renderPage();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("CID: J06.9")).toBeInTheDocument();
  });

  it("exibe queixa principal como preview", async () => {
    mockData.data = prontuariosMock;
    await renderPage();
    expect(screen.getByText("Dor de garganta há 3 dias")).toBeInTheDocument();
  });

  it("exibe conduta como fallback quando não há queixa", async () => {
    mockData.data = [prontuariosMock[1]];
    await renderPage();
    expect(screen.getByText("Retorno em 15 dias")).toBeInTheDocument();
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
});
