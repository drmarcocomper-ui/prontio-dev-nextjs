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

let callIndex = 0;
let mockResults: Record<string, unknown>[] = [];

function createQueryResult() {
  const idx = callIndex++;
  const result = {
    then: (resolve: (value: Record<string, unknown>) => void) =>
      resolve(mockResults[idx] ?? { data: [], count: 0 }),
    eq: () => createQueryResult(),
    neq: () => createQueryResult(),
    gte: () => createQueryResult(),
    lte: () => createQueryResult(),
    not: () => createQueryResult(),
    order: () => createQueryResult(),
    limit: () => createQueryResult(),
  };
  // Each chain consumes one index; subsequent chained calls reuse the same index
  callIndex = idx + 1;
  return result;
}

// Override: each .from().select() starts a new chain that resolves on await
function createFromResult() {
  return {
    select: () => {
      const idx = callIndex++;
      const chain = {
        then: (resolve: (value: Record<string, unknown>) => void) =>
          resolve(mockResults[idx] ?? { data: [], count: 0 }),
        eq: () => chain,
        neq: () => chain,
        gte: () => chain,
        lte: () => chain,
        not: () => chain,
        order: () => chain,
        limit: () => chain,
      };
      return chain;
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => createFromResult(),
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    }),
}));

import DashboardPage from "./page";

const proximasMock = [
  {
    id: "ag-1",
    hora_inicio: "09:00:00",
    hora_fim: "09:30:00",
    tipo: "consulta",
    status: "agendado",
    pacientes: { id: "p-1", nome: "Maria Silva" },
  },
  {
    id: "ag-2",
    hora_inicio: "10:00:00",
    hora_fim: "10:30:00",
    tipo: "retorno",
    status: "confirmado",
    pacientes: { id: "p-2", nome: "João Santos" },
  },
];

const atividadesMock = [
  {
    id: "pr-1",
    data: "2024-06-15",
    tipo: "consulta",
    created_at: new Date().toISOString(),
    pacientes: { id: "p-1", nome: "Maria Silva" },
  },
];

function makeActivity(id: string, minutesAgo: number, tipo: string | null = "consulta") {
  const date = new Date(Date.now() - minutesAgo * 60000);
  return {
    id,
    data: "2024-06-15",
    tipo,
    created_at: date.toISOString(),
    pacientes: { id: `p-${id}`, nome: `Paciente ${id}` },
  };
}

function setMockResults(overrides: Partial<{
  pacientesCount: number;
  consultasHoje: number;
  atendimentosMes: number;
  receitas: { valor: number }[];
  proximas: typeof proximasMock;
  atividades: typeof atividadesMock;
}> = {}) {
  callIndex = 0;
  mockResults = [
    { count: overrides.pacientesCount ?? 0 },
    { count: overrides.consultasHoje ?? 0 },
    { count: overrides.atendimentosMes ?? 0 },
    { data: overrides.receitas ?? [] },
    { data: overrides.proximas ?? [] },
    { data: overrides.atividades ?? [] },
  ];
}

async function renderPage() {
  const jsx = await DashboardPage();
  return render(jsx);
}

describe("DashboardPage", () => {
  beforeEach(() => {
    setMockResults();
  });

  it("renderiza o título Painel", async () => {
    await renderPage();
    expect(screen.getByText("Painel")).toBeInTheDocument();
  });

  it("renderiza os 4 cards de estatísticas", async () => {
    await renderPage();
    expect(screen.getByText("Pacientes")).toBeInTheDocument();
    expect(screen.getByText("Consultas hoje")).toBeInTheDocument();
    expect(screen.getByText("Atendimentos")).toBeInTheDocument();
    expect(screen.getByText("Receita")).toBeInTheDocument();
  });

  it("exibe contagens corretas nos cards", async () => {
    setMockResults({
      pacientesCount: 42,
      consultasHoje: 5,
      atendimentosMes: 18,
      receitas: [{ valor: 500 }, { valor: 350 }],
    });
    await renderPage();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("R$ 850,00")).toBeInTheDocument();
  });

  it("renderiza seção Próximas consultas", async () => {
    await renderPage();
    expect(screen.getByText("Próximas consultas")).toBeInTheDocument();
  });

  it("renderiza seção Atividade recente", async () => {
    await renderPage();
    expect(screen.getByText("Atividade recente")).toBeInTheDocument();
  });

  it("mostra estado vazio de consultas", async () => {
    await renderPage();
    expect(screen.getByText("Nenhuma consulta agendada para hoje.")).toBeInTheDocument();
  });

  it("mostra estado vazio de atividades", async () => {
    await renderPage();
    expect(screen.getByText("Nenhuma atividade registrada ainda.")).toBeInTheDocument();
  });

  it("renderiza próximas consultas com dados", async () => {
    setMockResults({ proximas: proximasMock });
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("João Santos")).toBeInTheDocument();
    expect(screen.getByText("09:00 – 09:30")).toBeInTheDocument();
    expect(screen.getByText("10:00 – 10:30")).toBeInTheDocument();
  });

  it("exibe tipo e status das consultas", async () => {
    setMockResults({ proximas: proximasMock });
    await renderPage();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("Retorno")).toBeInTheDocument();
    expect(screen.getByText("Agendado")).toBeInTheDocument();
    expect(screen.getByText("Confirmado")).toBeInTheDocument();
  });

  it("exibe iniciais dos pacientes", async () => {
    setMockResults({ proximas: proximasMock });
    await renderPage();
    expect(screen.getByText("MS")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("renderiza links para pacientes", async () => {
    setMockResults({ proximas: proximasMock });
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });

  it("renderiza atividades recentes com dados", async () => {
    setMockResults({ atividades: atividadesMock });
    await renderPage();
    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/15\/06\/2024/)).toBeInTheDocument();
  });

  it("exibe R$ 0,00 quando não há receitas", async () => {
    await renderPage();
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
  });

  it("exibe 'agora' para atividade criada há menos de 1 minuto", async () => {
    setMockResults({ atividades: [makeActivity("a1", 0)] });
    await renderPage();
    expect(screen.getByText("agora")).toBeInTheDocument();
  });

  it("exibe 'há X min' para atividade criada há minutos", async () => {
    setMockResults({ atividades: [makeActivity("a2", 15)] });
    await renderPage();
    expect(screen.getByText("há 15 min")).toBeInTheDocument();
  });

  it("exibe 'há Xh' para atividade criada há horas", async () => {
    setMockResults({ atividades: [makeActivity("a3", 180)] }); // 3 hours
    await renderPage();
    expect(screen.getByText("há 3h")).toBeInTheDocument();
  });

  it("exibe 'ontem' para atividade criada há 1 dia", async () => {
    setMockResults({ atividades: [makeActivity("a4", 60 * 25)] }); // 25 hours
    await renderPage();
    expect(screen.getByText("ontem")).toBeInTheDocument();
  });

  it("exibe 'há X dias' para atividade criada há dias", async () => {
    setMockResults({ atividades: [makeActivity("a5", 60 * 24 * 4)] }); // 4 days
    await renderPage();
    expect(screen.getByText("há 4 dias")).toBeInTheDocument();
  });

  it("exibe data formatada para atividade com mais de 7 dias", async () => {
    const oldDate = new Date(Date.now() - 60000 * 60 * 24 * 30); // 30 days ago
    setMockResults({
      atividades: [{
        id: "a6",
        data: "2024-06-15",
        tipo: "consulta",
        created_at: oldDate.toISOString(),
        pacientes: { id: "p-a6", nome: "Paciente Antigo" },
      }],
    });
    await renderPage();
    // Should show a formatted date like "15/05/2024" etc.
    expect(screen.getByText("Paciente Antigo")).toBeInTheDocument();
    // The time should be a date string, not "há X dias"
    expect(screen.queryByText(/^há/)).not.toBeInTheDocument();
    expect(screen.queryByText("agora")).not.toBeInTheDocument();
    expect(screen.queryByText("ontem")).not.toBeInTheDocument();
  });

  it("exibe 'Evolução' quando tipo da atividade é null", async () => {
    setMockResults({ atividades: [makeActivity("a7", 5, null)] });
    await renderPage();
    expect(screen.getByText(/Evolução/)).toBeInTheDocument();
  });

  it("exibe tipo raw quando não está no mapa TIPO_LABELS", async () => {
    setMockResults({
      proximas: [{
        id: "ag-x",
        hora_inicio: "14:00:00",
        hora_fim: "14:30:00",
        tipo: "outro_tipo",
        status: "custom_status",
        pacientes: { id: "p-x", nome: "Paciente X" },
      }],
    });
    await renderPage();
    expect(screen.getByText("outro_tipo")).toBeInTheDocument();
    expect(screen.getByText("custom_status")).toBeInTheDocument();
  });

  it("não exibe tipo quando consulta não tem tipo", async () => {
    setMockResults({
      proximas: [{
        id: "ag-no-type",
        hora_inicio: "16:00:00",
        hora_fim: "16:30:00",
        tipo: null,
        status: "agendado",
        pacientes: { id: "p-nt", nome: "Sem Tipo" },
      }],
    });
    await renderPage();
    expect(screen.getByText("Sem Tipo")).toBeInTheDocument();
    expect(screen.getByText("16:00 – 16:30")).toBeInTheDocument();
  });
});
