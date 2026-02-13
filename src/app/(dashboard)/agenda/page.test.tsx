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

vi.mock("./date-picker", () => ({
  DatePicker: ({ currentDate }: { currentDate: string }) => (
    <div data-testid="date-picker" data-date={currentDate} />
  ),
}));

vi.mock("./status-select", () => ({
  StatusSelect: ({ agendamentoId, currentStatus }: { agendamentoId: string; currentStatus: string }) => (
    <select data-testid={`status-select-${agendamentoId}`} defaultValue={currentStatus} />
  ),
}));

vi.mock("./status-badge", () => ({
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

const mockData: { data: unknown[] | null } = { data: [] };

function createQueryResult() {
  const result = {
    then: (resolve: (value: typeof mockData) => void) => resolve(mockData),
    eq: () => createQueryResult(),
    order: () => createQueryResult(),
  };
  return result;
}

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "medico",
    userId: "user-1",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({ select: () => createQueryResult() }),
    }),
}));

import AgendaPage from "./page";

const agendamentosMock = [
  {
    id: "ag-1",
    paciente_id: "p-1",
    data: "2024-06-15",
    hora_inicio: "09:00:00",
    hora_fim: "09:30:00",
    tipo: "consulta",
    status: "confirmado",
    observacoes: "Primeira consulta",
    pacientes: { id: "p-1", nome: "Maria Silva", telefone: "11999998888" },
  },
  {
    id: "ag-2",
    paciente_id: "p-2",
    data: "2024-06-15",
    hora_inicio: "10:00:00",
    hora_fim: "10:45:00",
    tipo: "retorno",
    status: "atendido",
    observacoes: null,
    pacientes: { id: "p-2", nome: "João Santos", telefone: null },
  },
];

async function renderPage(searchParams: { data?: string } = {}) {
  const jsx = await AgendaPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("AgendaPage", () => {
  beforeEach(() => {
    mockData.data = [];
  });

  it("renderiza o título Agenda", async () => {
    await renderPage();
    expect(screen.getByText("Agenda")).toBeInTheDocument();
  });

  it("renderiza o botão Novo agendamento com link correto", async () => {
    await renderPage({ data: "2024-06-15" });
    const links = screen.getAllByText("Novo agendamento");
    expect(links[0].closest("a")).toHaveAttribute("href", "/agenda/novo?data=2024-06-15");
  });

  it("renderiza o DatePicker com a data atual", async () => {
    await renderPage({ data: "2024-06-15" });
    const picker = screen.getByTestId("date-picker");
    expect(picker).toHaveAttribute("data-date", "2024-06-15");
  });

  it("mostra estado vazio quando não há agendamentos", async () => {
    mockData.data = [];
    await renderPage();
    expect(screen.getByText("Nenhum agendamento para este dia")).toBeInTheDocument();
    expect(screen.getByText("Agende uma consulta para começar.")).toBeInTheDocument();
  });

  it("renderiza lista de agendamentos", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("João Santos")).toBeInTheDocument();
  });

  it("exibe contagem de agendamentos", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    expect(screen.getByText(/2 agendamentos/)).toBeInTheDocument();
  });

  it("exibe contagem de atendidos", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    expect(screen.getByText(/1 atendido(?!s)/)).toBeInTheDocument();
  });

  it("exibe contagem singular para 1 agendamento", async () => {
    mockData.data = [agendamentosMock[0]];
    await renderPage();
    expect(screen.getByText(/1 agendamento(?!s)/)).toBeInTheDocument();
  });

  it("formata horários corretamente", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("até 09:30")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("até 10:45")).toBeInTheDocument();
  });

  it("exibe tipo do agendamento com label correto", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Retorno")).toBeInTheDocument();
  });

  it("exibe observações quando disponíveis", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    expect(screen.getByText("Primeira consulta")).toBeInTheDocument();
  });

  it("exibe iniciais dos pacientes", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    expect(screen.getByText("MS")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("link do paciente aponta para a página de detalhes do agendamento", async () => {
    mockData.data = [agendamentosMock[0]];
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/agenda/ag-1");
  });

  it("renderiza StatusSelect para cada agendamento", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    expect(screen.getByTestId("status-select-ag-1")).toBeInTheDocument();
    expect(screen.getByTestId("status-select-ag-2")).toBeInTheDocument();
  });

  it("exibe valor raw quando tipo não está em TIPO_LABELS", async () => {
    mockData.data = [{
      ...agendamentosMock[0],
      tipo: "tipo_desconhecido",
    }];
    await renderPage();
    expect(screen.getByText("tipo_desconhecido")).toBeInTheDocument();
  });

  it("lida com agendamentos null do Supabase", async () => {
    mockData.data = null;
    await renderPage();
    expect(screen.getByText("Nenhum agendamento para este dia")).toBeInTheDocument();
  });
});
