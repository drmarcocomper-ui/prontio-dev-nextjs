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

vi.mock("./filters", () => ({
  AgendaFilters: ({ currentStatus, currentTipo, total }: { currentStatus: string; currentTipo: string; total: number }) => (
    <div data-testid="agenda-filters" data-status={currentStatus} data-tipo={currentTipo} data-total={total} />
  ),
}));

vi.mock("./view-toggle", () => ({
  ViewToggle: () => <div data-testid="view-toggle" />,
}));

vi.mock("./time-grid", () => ({
  TimeGrid: ({ slots, isDayOff }: { slots: unknown[]; isDayOff: boolean }) => (
    <div data-testid="time-grid" data-slots={slots.length} data-dayoff={isDayOff} />
  ),
  generateTimeSlots: () => [],
}));

vi.mock("./weekly-grid", () => ({
  WeeklyGrid: () => <div data-testid="weekly-grid" />,
}));

vi.mock("@/lib/date", () => ({
  todayLocal: () => "2024-06-15",
  parseLocalDate: (s: string) => new Date(s + "T12:00:00"),
}));

vi.mock("./utils", () => ({
  getHorarioConfig: vi.fn().mockResolvedValue({
    horario_seg_inicio: "08:00",
    horario_seg_fim: "18:00",
    horario_sab_inicio: "08:00",
    horario_sab_fim: "18:00",
    duracao_consulta: "15",
  }),
  DIAS_SEMANA: {
    0: { key: "dom", label: "domingo" },
    1: { key: "seg", label: "segunda-feira" },
    2: { key: "ter", label: "terça-feira" },
    3: { key: "qua", label: "quarta-feira" },
    4: { key: "qui", label: "quinta-feira" },
    5: { key: "sex", label: "sexta-feira" },
    6: { key: "sab", label: "sábado" },
  },
  getWeekRange: vi.fn().mockReturnValue({ start: "2024-06-10", end: "2024-06-16", weekStart: "2024-06-10", weekEnd: "2024-06-16", weekDates: ["2024-06-10", "2024-06-11", "2024-06-12", "2024-06-13", "2024-06-14", "2024-06-15", "2024-06-16"] }),
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
    papel: "profissional_saude",
    userId: "user-1",
  }),
  getMedicoId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "horarios_profissional") {
          return { select: () => ({ eq: () => ({ eq: () => ({ data: null, error: null }) }) }) };
        }
        if (table === "configuracoes") {
          return { select: () => ({ eq: () => ({ in: () => ({ data: [], error: null }) }) }) };
        }
        return { select: () => createQueryResult() };
      },
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

async function renderPage(searchParams: { data?: string; status?: string; tipo?: string } = {}) {
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

  it("renderiza o TimeGrid", async () => {
    await renderPage();
    expect(screen.getByTestId("time-grid")).toBeInTheDocument();
  });

  it("renderiza o ViewToggle", async () => {
    await renderPage();
    expect(screen.getByTestId("view-toggle")).toBeInTheDocument();
  });

  it("renderiza AgendaFilters com contagens", async () => {
    mockData.data = agendamentosMock;
    await renderPage();
    const filters = screen.getByTestId("agenda-filters");
    expect(filters).toHaveAttribute("data-total", "2");
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

  it("lida com agendamentos null do Supabase", async () => {
    mockData.data = null;
    await renderPage();
    // Page renders with 0 agendamentos — TimeGrid gets empty slots
    expect(screen.getByText(/0 agendamentos/)).toBeInTheDocument();
  });
});
