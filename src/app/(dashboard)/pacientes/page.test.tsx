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

vi.mock("./types", async () => {
  const actual = await vi.importActual("./types");
  return { ...actual };
});

vi.mock("@/components/search-input", () => ({
  SearchInput: ({ defaultValue }: { defaultValue?: string }) => (
    <input placeholder="Buscar" defaultValue={defaultValue} data-testid="search-input" />
  ),
}));

vi.mock("@/components/pagination", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("@/components/sortable-header", () => ({
  SortableHeader: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
}));

vi.mock("./filters", () => ({
  PacienteFilters: () => <div data-testid="filters" />,
}));

const mockData: { data: unknown[] | null; count: number } = { data: [], count: 0 };

function createQueryResult() {
  const result = {
    then: (resolve: (value: typeof mockData) => void) => resolve(mockData),
    or: () => createQueryResult(),
    order: () => createQueryResult(),
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

import PacientesPage from "./page";

const pacientesMock = [
  {
    id: "1",
    nome: "Maria Silva",
    cpf: "12345678901",
    telefone: "11999998888",
    email: "maria@email.com",
    data_nascimento: "1990-05-15",
    created_at: "2024-01-01",
  },
  {
    id: "2",
    nome: "João Santos",
    cpf: null,
    telefone: null,
    email: null,
    data_nascimento: null,
    created_at: "2024-01-02",
  },
];

async function renderPage(searchParams: { q?: string } = {}) {
  const jsx = await PacientesPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("PacientesPage", () => {
  beforeEach(() => {
    mockData.data = [];
    mockData.count = 0;
  });

  it("renderiza o título Pacientes", async () => {
    await renderPage();
    expect(screen.getByText("Pacientes")).toBeInTheDocument();
  });

  it("renderiza o botão Novo paciente com link correto", async () => {
    await renderPage();
    const links = screen.getAllByText("Novo paciente");
    expect(links[0].closest("a")).toHaveAttribute("href", "/pacientes/novo");
  });

  it("renderiza o SearchInput", async () => {
    await renderPage();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há pacientes", async () => {
    mockData.data = [];
    await renderPage();
    expect(screen.getByText("Nenhum paciente encontrado")).toBeInTheDocument();
    expect(screen.getByText("Comece cadastrando seu primeiro paciente.")).toBeInTheDocument();
  });

  it("mostra mensagem diferente no estado vazio quando há busca", async () => {
    mockData.data = [];
    await renderPage({ q: "xyz" });
    expect(screen.getByText("Nenhum paciente encontrado")).toBeInTheDocument();
    expect(screen.getByText("Tente buscar com outros termos.")).toBeInTheDocument();
  });

  it("renderiza tabela com pacientes", async () => {
    mockData.data = pacientesMock;
    await renderPage();
    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("João Santos").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe contagem de pacientes", async () => {
    mockData.data = pacientesMock;
    mockData.count = 2;
    await renderPage();
    expect(screen.getByText("2 pacientes cadastrados")).toBeInTheDocument();
  });

  it("exibe contagem singular para 1 paciente", async () => {
    mockData.data = [pacientesMock[0]];
    mockData.count = 1;
    await renderPage();
    expect(screen.getByText("1 paciente cadastrado")).toBeInTheDocument();
  });

  it("formata CPF corretamente", async () => {
    mockData.data = pacientesMock;
    await renderPage();
    expect(screen.getAllByText("123.456.789-01").length).toBeGreaterThanOrEqual(1);
  });

  it("formata telefone corretamente", async () => {
    mockData.data = pacientesMock;
    await renderPage();
    expect(screen.getAllByText("(11) 99999-8888").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe traço quando dados são nulos", async () => {
    mockData.data = [pacientesMock[1]];
    await renderPage();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(3);
  });

  it("exibe iniciais do paciente", async () => {
    mockData.data = pacientesMock;
    await renderPage();
    expect(screen.getAllByText("MS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("JS").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe email do paciente quando disponível", async () => {
    mockData.data = pacientesMock;
    await renderPage();
    expect(screen.getByText("maria@email.com")).toBeInTheDocument();
  });

  it("link do paciente aponta para a página de detalhes", async () => {
    mockData.data = [pacientesMock[0]];
    await renderPage();
    const elements = screen.getAllByText("Maria Silva");
    const link = elements.find((el) => el.closest("a")?.getAttribute("href") === "/pacientes/1");
    expect(link).toBeTruthy();
  });

  it("formata telefone fixo com 10 dígitos", async () => {
    mockData.data = [{ ...pacientesMock[0], telefone: "1133334444" }];
    await renderPage();
    expect(screen.getAllByText("(11) 3333-4444").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe telefone sem formatação quando formato desconhecido", async () => {
    mockData.data = [{ ...pacientesMock[0], telefone: "123" }];
    await renderPage();
    expect(screen.getAllByText("123").length).toBeGreaterThanOrEqual(1);
  });

  it("lida com pacientes null do Supabase", async () => {
    mockData.data = null;
    await renderPage();
    expect(screen.getByText("Nenhum paciente encontrado")).toBeInTheDocument();
  });
});
