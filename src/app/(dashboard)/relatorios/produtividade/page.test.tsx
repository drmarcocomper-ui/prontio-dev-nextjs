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

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("./month-filter", () => ({
  MonthFilter: () => <div data-testid="month-filter" />,
}));

vi.mock("./export-csv-button", () => ({
  ExportCsvButton: () => <button data-testid="export-csv">Exportar CSV</button>,
}));

vi.mock("../components/report-nav", () => ({
  ReportNav: () => <nav data-testid="report-nav" />,
}));

vi.mock("@/components/empty-state", () => ({
  EmptyStateIllustration: () => <div data-testid="empty-illustration" />,
}));

vi.mock("./utils", async () => {
  const actual = await vi.importActual("./utils");
  return { ...actual };
});

const mockAgendamentos: { data: unknown[] | null } = { data: [] };
const mockConfig: { data: unknown[] | null } = { data: [] };

let fromTable = "";

function createQueryResult(mockRef: { data: unknown[] | null }) {
  const result = {
    then: (resolve: (value: typeof mockRef) => void) => resolve(mockRef),
    select: () => createQueryResult(mockRef),
    eq: () => createQueryResult(mockRef),
    gte: () => createQueryResult(mockRef),
    lte: () => createQueryResult(mockRef),
    order: () => createQueryResult(mockRef),
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
      from: (table: string) => {
        fromTable = table;
        return {
          select: () => {
            if (fromTable === "agendamentos") return createQueryResult(mockAgendamentos);
            return createQueryResult(mockConfig);
          },
        };
      },
    }),
}));

import RelatorioProdutividadePage from "./page";

const agendamentosMock = [
  {
    id: "a-1",
    data: "2024-06-10",
    hora_inicio: "08:00:00",
    hora_fim: "09:00:00",
    tipo: "consulta",
    status: "atendido",
    valor: 300,
    observacoes: null,
    pacientes: { nome: "Maria Silva", medico_id: "doc-1" },
  },
  {
    id: "a-2",
    data: "2024-06-11",
    hora_inicio: "09:00:00",
    hora_fim: "10:00:00",
    tipo: "retorno",
    status: "cancelado",
    valor: 150,
    observacoes: null,
    pacientes: { nome: "João Santos", medico_id: "doc-1" },
  },
  {
    id: "a-3",
    data: "2024-06-12",
    hora_inicio: "10:00:00",
    hora_fim: "11:00:00",
    tipo: "exame",
    status: "faltou",
    valor: 200,
    observacoes: null,
    pacientes: { nome: "Ana Costa", medico_id: "doc-2" },
  },
  {
    id: "a-4",
    data: "2024-06-13",
    hora_inicio: "14:00:00",
    hora_fim: "15:00:00",
    tipo: "consulta",
    status: "atendido",
    valor: 500,
    observacoes: null,
    pacientes: { nome: "Carlos Lima", medico_id: "doc-2" },
  },
];

const configMock = [
  { valor: "Dr. Silva", user_id: "doc-1" },
  { valor: "Dra. Santos", user_id: "doc-2" },
];

async function renderPage(searchParams: { mes?: string } = {}) {
  const jsx = await RelatorioProdutividadePage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("RelatorioProdutividadePage", () => {
  beforeEach(() => {
    mockAgendamentos.data = [];
    mockConfig.data = [];
  });

  it("renderiza o título Relatório de Produtividade", async () => {
    await renderPage();
    expect(screen.getByText("Relatório de Produtividade")).toBeInTheDocument();
  });

  it("renderiza MonthFilter, ExportCsv e ReportNav", async () => {
    await renderPage();
    expect(screen.getByTestId("month-filter")).toBeInTheDocument();
    expect(screen.getByTestId("export-csv")).toBeInTheDocument();
    expect(screen.getByTestId("report-nav")).toBeInTheDocument();
  });

  it("renderiza link Imprimir com mês correto", async () => {
    await renderPage({ mes: "2024-06" });
    const link = screen.getByText("Imprimir").closest("a");
    expect(link).toHaveAttribute("href", "/relatorios/produtividade/imprimir?mes=2024-06");
  });

  it("renderiza os 6 KPI cards", async () => {
    await renderPage();
    expect(screen.getByText("Total Agendamentos")).toBeInTheDocument();
    expect(screen.getByText("Atendidos")).toBeInTheDocument();
    expect(screen.getByText("Cancelamentos")).toBeInTheDocument();
    expect(screen.getByText("Faltas")).toBeInTheDocument();
    expect(screen.getByText("Média Diária")).toBeInTheDocument();
    expect(screen.getByText("Receita")).toBeInTheDocument();
  });

  it("calcula KPIs corretamente com dados", async () => {
    mockAgendamentos.data = agendamentosMock;
    mockConfig.data = configMock;
    await renderPage({ mes: "2024-06" });
    // Total = 4, Atendidos = 2, Cancelamentos = 1, Faltas = 1
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renderiza breakdown por profissional com dados", async () => {
    mockAgendamentos.data = agendamentosMock;
    mockConfig.data = configMock;
    await renderPage({ mes: "2024-06" });
    expect(screen.getByText("Por profissional")).toBeInTheDocument();
    expect(screen.getByText("Dr. Silva")).toBeInTheDocument();
    expect(screen.getByText("Dra. Santos")).toBeInTheDocument();
  });

  it("renderiza breakdown por tipo de atendimento", async () => {
    mockAgendamentos.data = agendamentosMock;
    await renderPage({ mes: "2024-06" });
    expect(screen.getByText("Por tipo de atendimento")).toBeInTheDocument();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Retorno")).toBeInTheDocument();
    expect(screen.getByText("Exame")).toBeInTheDocument();
  });

  it("renderiza breakdown por dia da semana", async () => {
    mockAgendamentos.data = agendamentosMock;
    await renderPage({ mes: "2024-06" });
    expect(screen.getByText("Por dia da semana")).toBeInTheDocument();
  });

  it("exibe nomes de pacientes nas tabelas de breakdown", async () => {
    mockAgendamentos.data = agendamentosMock;
    mockConfig.data = configMock;
    await renderPage({ mes: "2024-06" });
    expect(screen.getByText("Dr. Silva")).toBeInTheDocument();
    expect(screen.getByText("Dra. Santos")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há agendamentos", async () => {
    await renderPage();
    expect(screen.getByText("Nenhum agendamento neste período")).toBeInTheDocument();
  });

  it("lida com agendamentos null do Supabase", async () => {
    mockAgendamentos.data = null;
    await renderPage();
    expect(screen.getByText("Nenhum agendamento neste período")).toBeInTheDocument();
  });

  it("não exibe tabelas de breakdown quando não há dados", async () => {
    await renderPage();
    expect(screen.queryByText("Por profissional")).not.toBeInTheDocument();
    expect(screen.queryByText("Por tipo de atendimento")).not.toBeInTheDocument();
    expect(screen.queryByText("Por dia da semana")).not.toBeInTheDocument();
  });

  it("exibe KPIs zerados quando não há dados", async () => {
    await renderPage();
    // 3 percentage KPIs: taxa conclusão, taxa cancelamento, taxa falta
    expect(screen.getAllByText("0.0%")).toHaveLength(3);
  });
});
