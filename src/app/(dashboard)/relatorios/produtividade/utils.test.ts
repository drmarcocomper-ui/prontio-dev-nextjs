import { describe, it, expect } from "vitest";
import {
  computeKPIs,
  aggregateByProfissional,
  aggregateByTipo,
  aggregateByDiaSemana,
  buildTipoChartData,
  buildDiaSemanaChartData,
  buildStatusChartData,
  REPORT_SELECT,
  type AgendamentoReport,
} from "./utils";

const items: AgendamentoReport[] = [
  {
    id: "1",
    data: "2024-06-10", // Monday
    hora_inicio: "08:00",
    hora_fim: "09:00",
    tipo: "consulta",
    status: "atendido",
    valor: 300,
    observacoes: null,
    pacientes: { nome: "Maria", medico_id: "doc-1" },
  },
  {
    id: "2",
    data: "2024-06-11", // Tuesday
    hora_inicio: "09:00",
    hora_fim: "10:00",
    tipo: "retorno",
    status: "cancelado",
    valor: 150,
    observacoes: null,
    pacientes: { nome: "João", medico_id: "doc-1" },
  },
  {
    id: "3",
    data: "2024-06-12", // Wednesday
    hora_inicio: "10:00",
    hora_fim: "11:00",
    tipo: "consulta",
    status: "faltou",
    valor: 200,
    observacoes: null,
    pacientes: { nome: "Ana", medico_id: "doc-2" },
  },
  {
    id: "4",
    data: "2024-06-13", // Thursday
    hora_inicio: "14:00",
    hora_fim: "15:00",
    tipo: "exame",
    status: "atendido",
    valor: 500,
    observacoes: null,
    pacientes: { nome: "Carlos", medico_id: "doc-2" },
  },
  {
    id: "5",
    data: "2024-06-14", // Friday
    hora_inicio: "08:00",
    hora_fim: "09:00",
    tipo: null,
    status: "agendado",
    valor: null,
    observacoes: null,
    pacientes: { nome: "Pedro", medico_id: "doc-1" },
  },
];

describe("computeKPIs", () => {
  it("calcula todas as métricas corretamente", () => {
    const kpis = computeKPIs(items, "2024-06-01", "2024-06-30");
    expect(kpis.total).toBe(5);
    expect(kpis.atendidos).toBe(2);
    expect(kpis.taxaConclusao).toBeCloseTo(40);
    expect(kpis.cancelamentos).toBe(1);
    expect(kpis.taxaCancelamento).toBeCloseTo(20);
    expect(kpis.faltas).toBe(1);
    expect(kpis.taxaFalta).toBeCloseTo(20);
    expect(kpis.receita).toBe(800); // 300 + 500
  });

  it("calcula média diária com base nos dias do período", () => {
    const kpis = computeKPIs(items, "2024-06-01", "2024-06-30");
    expect(kpis.mediaDiaria).toBeCloseTo(5 / 30);
  });

  it("retorna zeros para lista vazia", () => {
    const kpis = computeKPIs([], "2024-06-01", "2024-06-30");
    expect(kpis.total).toBe(0);
    expect(kpis.atendidos).toBe(0);
    expect(kpis.taxaConclusao).toBe(0);
    expect(kpis.cancelamentos).toBe(0);
    expect(kpis.faltas).toBe(0);
    expect(kpis.mediaDiaria).toBe(0);
    expect(kpis.receita).toBe(0);
  });

  it("conta receita apenas de atendidos", () => {
    const kpis = computeKPIs(items, "2024-06-01", "2024-06-30");
    // cancelado (150) e faltou (200) não entram na receita
    expect(kpis.receita).toBe(800);
  });
});

describe("aggregateByProfissional", () => {
  it("agrupa por medico_id com nomes do mapa", () => {
    const nomeMap = new Map([
      ["doc-1", "Dr. Silva"],
      ["doc-2", "Dra. Santos"],
    ]);
    const result = aggregateByProfissional(items, nomeMap);
    expect(result).toHaveLength(2);

    const doc1 = result.find((r) => r.medicoId === "doc-1");
    expect(doc1).toBeDefined();
    expect(doc1!.nome).toBe("Dr. Silva");
    expect(doc1!.total).toBe(3);
    expect(doc1!.atendidos).toBe(1);
    expect(doc1!.cancelamentos).toBe(1);
    expect(doc1!.receita).toBe(300);
  });

  it("usa fallback quando medico_id não está no mapa", () => {
    const result = aggregateByProfissional(items, new Map());
    for (const row of result) {
      expect(row.nome).toBe("Profissional não identificado");
    }
  });

  it("ordena por total decrescente", () => {
    const nomeMap = new Map([
      ["doc-1", "Dr. Silva"],
      ["doc-2", "Dra. Santos"],
    ]);
    const result = aggregateByProfissional(items, nomeMap);
    expect(result[0].total).toBeGreaterThanOrEqual(result[1].total);
  });

  it("retorna array vazio para lista vazia", () => {
    expect(aggregateByProfissional([], new Map())).toEqual([]);
  });
});

describe("aggregateByTipo", () => {
  it("agrupa por tipo de atendimento", () => {
    const result = aggregateByTipo(items);
    const consulta = result.find((r) => r.tipo === "consulta");
    expect(consulta).toBeDefined();
    expect(consulta!.label).toBe("Consulta");
    expect(consulta!.total).toBe(2);
    expect(consulta!.atendidos).toBe(1);
    expect(consulta!.faltas).toBe(1);
  });

  it("trata itens sem tipo como sem_tipo", () => {
    const result = aggregateByTipo(items);
    const semTipo = result.find((r) => r.tipo === "sem_tipo");
    expect(semTipo).toBeDefined();
    expect(semTipo!.label).toBe("Sem tipo");
    expect(semTipo!.total).toBe(1);
  });

  it("ordena por total decrescente", () => {
    const result = aggregateByTipo(items);
    const totals = result.map((r) => r.total);
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeLessThanOrEqual(totals[i - 1]);
    }
  });

  it("retorna array vazio para lista vazia", () => {
    expect(aggregateByTipo([])).toEqual([]);
  });
});

describe("aggregateByDiaSemana", () => {
  it("agrupa por dia da semana e calcula média diária", () => {
    const result = aggregateByDiaSemana(items, "2024-06-01", "2024-06-30");
    expect(result.length).toBeGreaterThan(0);
    // Monday (2024-06-10) has 1 item
    const monday = result.find((r) => r.label === "Segunda");
    expect(monday).toBeDefined();
    expect(monday!.total).toBe(1);
  });

  it("filtra dias sem agendamentos", () => {
    const result = aggregateByDiaSemana(items, "2024-06-01", "2024-06-30");
    for (const row of result) {
      expect(row.total).toBeGreaterThan(0);
    }
  });

  it("retorna array vazio para lista vazia", () => {
    expect(aggregateByDiaSemana([], "2024-06-01", "2024-06-30")).toEqual([]);
  });
});

describe("buildTipoChartData", () => {
  it("retorna dados por tipo para gráfico", () => {
    const data = buildTipoChartData(items);
    expect(data.length).toBeGreaterThan(0);
    const consulta = data.find((d) => d.tipo === "Consulta");
    expect(consulta).toBeDefined();
    expect(consulta!.total).toBe(2);
  });
});

describe("buildDiaSemanaChartData", () => {
  it("retorna dados por dia da semana para gráfico", () => {
    const data = buildDiaSemanaChartData(items);
    expect(data.length).toBeGreaterThan(0);
  });
});

describe("buildStatusChartData", () => {
  it("retorna dados por status para gráfico com cores", () => {
    const data = buildStatusChartData(items);
    expect(data.length).toBeGreaterThan(0);
    const atendido = data.find((d) => d.status === "Atendido");
    expect(atendido).toBeDefined();
    expect(atendido!.total).toBe(2);
    expect(atendido!.fill).toBe("#10b981");
  });
});

describe("REPORT_SELECT", () => {
  it("inclui campos necessários", () => {
    expect(REPORT_SELECT).toContain("id");
    expect(REPORT_SELECT).toContain("data");
    expect(REPORT_SELECT).toContain("hora_inicio");
    expect(REPORT_SELECT).toContain("hora_fim");
    expect(REPORT_SELECT).toContain("tipo");
    expect(REPORT_SELECT).toContain("status");
    expect(REPORT_SELECT).toContain("valor");
    expect(REPORT_SELECT).toContain("pacientes(nome, medico_id)");
  });
});
