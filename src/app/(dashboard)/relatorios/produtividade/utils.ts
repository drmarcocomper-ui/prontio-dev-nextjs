import { getMonthDateRange, getMonthLabel } from "../financeiro/utils";
import { parseLocalDate } from "@/lib/date";

// Re-export para uso no page.tsx
export { getMonthDateRange, getMonthLabel };

// --- Types ---

export interface AgendamentoReport {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  tipo: string | null;
  status: string;
  valor: number | null;
  observacoes: string | null;
  pacientes: { nome: string; medico_id: string } | null;
}

export interface ProdutividadeKPIs {
  total: number;
  atendidos: number;
  taxaConclusao: number;
  cancelamentos: number;
  taxaCancelamento: number;
  faltas: number;
  taxaFalta: number;
  mediaDiaria: number;
  receita: number;
}

export interface ProfissionalRow {
  medicoId: string;
  nome: string;
  total: number;
  atendidos: number;
  cancelamentos: number;
  faltas: number;
  receita: number;
}

export interface TipoRow {
  tipo: string;
  label: string;
  total: number;
  atendidos: number;
  cancelamentos: number;
  faltas: number;
}

export interface DiaSemanaRow {
  dia: number;
  label: string;
  total: number;
  atendidos: number;
  mediaDiaria: number;
}

// --- Constants ---

export const TIPO_LABELS: Record<string, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  avaliacao: "Avaliação",
};

export const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  atendido: "Atendido",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

export const STATUS_COLORS: Record<string, string> = {
  agendado: "#3b82f6",
  confirmado: "#8b5cf6",
  em_atendimento: "#f59e0b",
  atendido: "#10b981",
  cancelado: "#ef4444",
  faltou: "#6b7280",
};

export const REPORT_SELECT =
  "id, data, hora_inicio, hora_fim, tipo, status, valor, observacoes, pacientes(nome, medico_id)";

const DIA_SEMANA_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

// --- Pure functions ---

export function computeKPIs(
  items: AgendamentoReport[],
  startDate: string,
  endDate: string,
): ProdutividadeKPIs {
  const total = items.length;
  const atendidos = items.filter((a) => a.status === "atendido").length;
  const cancelamentos = items.filter((a) => a.status === "cancelado").length;
  const faltas = items.filter((a) => a.status === "faltou").length;
  const receita = items
    .filter((a) => a.status === "atendido" && a.valor != null)
    .reduce((sum, a) => sum + (a.valor ?? 0), 0);

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const dias = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);

  return {
    total,
    atendidos,
    taxaConclusao: total > 0 ? (atendidos / total) * 100 : 0,
    cancelamentos,
    taxaCancelamento: total > 0 ? (cancelamentos / total) * 100 : 0,
    faltas,
    taxaFalta: total > 0 ? (faltas / total) * 100 : 0,
    mediaDiaria: total > 0 ? total / dias : 0,
    receita,
  };
}

export function aggregateByProfissional(
  items: AgendamentoReport[],
  nomeMap: Map<string, string>,
): ProfissionalRow[] {
  const map = new Map<
    string,
    { total: number; atendidos: number; cancelamentos: number; faltas: number; receita: number }
  >();

  for (const a of items) {
    const medicoId = a.pacientes?.medico_id ?? "desconhecido";
    const entry = map.get(medicoId) ?? {
      total: 0,
      atendidos: 0,
      cancelamentos: 0,
      faltas: 0,
      receita: 0,
    };
    entry.total += 1;
    if (a.status === "atendido") {
      entry.atendidos += 1;
      entry.receita += a.valor ?? 0;
    }
    if (a.status === "cancelado") entry.cancelamentos += 1;
    if (a.status === "faltou") entry.faltas += 1;
    map.set(medicoId, entry);
  }

  return Array.from(map.entries())
    .map(([medicoId, vals]) => ({
      medicoId,
      nome: nomeMap.get(medicoId) ?? "Profissional não identificado",
      ...vals,
    }))
    .sort((a, b) => b.total - a.total);
}

export function aggregateByTipo(items: AgendamentoReport[]): TipoRow[] {
  const map = new Map<
    string,
    { total: number; atendidos: number; cancelamentos: number; faltas: number }
  >();

  for (const a of items) {
    const tipo = a.tipo ?? "sem_tipo";
    const entry = map.get(tipo) ?? { total: 0, atendidos: 0, cancelamentos: 0, faltas: 0 };
    entry.total += 1;
    if (a.status === "atendido") entry.atendidos += 1;
    if (a.status === "cancelado") entry.cancelamentos += 1;
    if (a.status === "faltou") entry.faltas += 1;
    map.set(tipo, entry);
  }

  return Array.from(map.entries())
    .map(([tipo, vals]) => ({
      tipo,
      label: tipo === "sem_tipo" ? "Sem tipo" : (TIPO_LABELS[tipo] ?? tipo),
      ...vals,
    }))
    .sort((a, b) => b.total - a.total);
}

export function aggregateByDiaSemana(
  items: AgendamentoReport[],
  startDate: string,
  endDate: string,
): DiaSemanaRow[] {
  const countByDay = new Map<number, { total: number; atendidos: number }>();
  for (let i = 0; i < 7; i++) {
    countByDay.set(i, { total: 0, atendidos: 0 });
  }

  for (const a of items) {
    const day = parseLocalDate(a.data).getDay();
    const entry = countByDay.get(day)!;
    entry.total += 1;
    if (a.status === "atendido") entry.atendidos += 1;
  }

  // Count occurrences of each weekday in the range
  const weekdayOccurrences = new Map<number, number>();
  for (let i = 0; i < 7; i++) weekdayOccurrences.set(i, 0);
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const cursor = new Date(start);
  while (cursor <= end) {
    weekdayOccurrences.set(cursor.getDay(), (weekdayOccurrences.get(cursor.getDay()) ?? 0) + 1);
    cursor.setDate(cursor.getDate() + 1);
  }

  return Array.from(countByDay.entries())
    .filter(([, vals]) => vals.total > 0)
    .map(([dia, vals]) => {
      const occ = weekdayOccurrences.get(dia) ?? 1;
      return {
        dia,
        label: DIA_SEMANA_LABELS[dia],
        total: vals.total,
        atendidos: vals.atendidos,
        mediaDiaria: occ > 0 ? vals.total / occ : 0,
      };
    })
    .sort((a, b) => {
      // Monday first (1,2,3,4,5,6,0)
      const order = (d: number) => (d === 0 ? 7 : d);
      return order(a.dia) - order(b.dia);
    });
}

// --- Chart data builders ---

export interface TipoChartItem {
  tipo: string;
  total: number;
}

export interface DiaSemanaChartItem {
  dia: string;
  total: number;
  atendidos: number;
}

export interface StatusChartItem {
  status: string;
  total: number;
  fill: string;
}

export function buildTipoChartData(items: AgendamentoReport[]): TipoChartItem[] {
  const map = new Map<string, number>();
  for (const a of items) {
    const tipo = a.tipo ?? "sem_tipo";
    map.set(tipo, (map.get(tipo) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([tipo, total]) => ({
      tipo: tipo === "sem_tipo" ? "Sem tipo" : (TIPO_LABELS[tipo] ?? tipo),
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function buildDiaSemanaChartData(items: AgendamentoReport[]): DiaSemanaChartItem[] {
  const map = new Map<number, { total: number; atendidos: number }>();
  for (let i = 0; i < 7; i++) map.set(i, { total: 0, atendidos: 0 });

  for (const a of items) {
    const day = parseLocalDate(a.data).getDay();
    const entry = map.get(day)!;
    entry.total += 1;
    if (a.status === "atendido") entry.atendidos += 1;
  }

  return Array.from(map.entries())
    .filter(([, vals]) => vals.total > 0)
    .map(([dia, vals]) => ({
      dia: DIA_SEMANA_LABELS[dia],
      ...vals,
    }))
    .sort((a, b) => {
      const order = (label: string) => {
        const idx = DIA_SEMANA_LABELS.indexOf(label);
        return idx === 0 ? 7 : idx;
      };
      return order(a.dia) - order(b.dia);
    });
}

export function buildStatusChartData(items: AgendamentoReport[]): StatusChartItem[] {
  const map = new Map<string, number>();
  for (const a of items) {
    map.set(a.status, (map.get(a.status) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([status, total]) => ({
      status: STATUS_LABELS[status] ?? status,
      total,
      fill: STATUS_COLORS[status] ?? "#9ca3af",
    }))
    .sort((a, b) => b.total - a.total);
}
