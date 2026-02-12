import {
  CATEGORIA_LABELS,
  PAGAMENTO_LABELS,
  type TransacaoListItem,
} from "../../financeiro/constants";

export interface CategoriaBreakdownRow {
  categoria: string;
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface PagamentoBreakdownRow {
  forma: string;
  label: string;
  qtd: number;
  total: number;
}

export const REPORT_SELECT =
  "id, tipo, categoria, descricao, valor, data, forma_pagamento, status, pacientes(nome)";

export function getMonthDateRange(mes?: string) {
  const now = new Date();
  const currentMonth =
    mes || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = currentMonth.split("-").map(Number);
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];
  return { currentMonth, year, month, startDate, endDate };
}

export function computeKPIs(items: TransacaoListItem[]) {
  const totalReceitas = items
    .filter((t) => t.tipo === "receita" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesas = items
    .filter((t) => t.tipo === "despesa" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.valor, 0);

  return { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas };
}

export function getMonthLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function aggregateByCategoria(
  items: TransacaoListItem[],
): CategoriaBreakdownRow[] {
  const categoriaMap = new Map<string, { receitas: number; despesas: number }>();
  for (const t of items) {
    if (t.status === "cancelado") continue;
    const cat = t.categoria ?? "sem_categoria";
    const entry = categoriaMap.get(cat) ?? { receitas: 0, despesas: 0 };
    if (t.tipo === "receita") {
      entry.receitas += t.valor;
    } else {
      entry.despesas += t.valor;
    }
    categoriaMap.set(cat, entry);
  }

  return Array.from(categoriaMap.entries())
    .map(([cat, vals]) => ({
      categoria: cat,
      label:
        cat === "sem_categoria"
          ? "Sem categoria"
          : (CATEGORIA_LABELS[cat] ?? cat),
      receitas: vals.receitas,
      despesas: vals.despesas,
      saldo: vals.receitas - vals.despesas,
    }))
    .sort((a, b) => b.receitas + b.despesas - (a.receitas + a.despesas));
}

export function aggregateByPagamento(
  items: TransacaoListItem[],
): PagamentoBreakdownRow[] {
  const pagamentoMap = new Map<string, { qtd: number; total: number }>();
  for (const t of items) {
    if (t.status === "cancelado") continue;
    const pg = t.forma_pagamento ?? "nao_informado";
    const entry = pagamentoMap.get(pg) ?? { qtd: 0, total: 0 };
    entry.qtd += 1;
    entry.total += t.valor;
    pagamentoMap.set(pg, entry);
  }

  return Array.from(pagamentoMap.entries())
    .map(([pg, vals]) => ({
      forma: pg,
      label:
        pg === "nao_informado"
          ? "Não informado"
          : (PAGAMENTO_LABELS[pg] ?? pg),
      qtd: vals.qtd,
      total: vals.total,
    }))
    .sort((a, b) => b.total - a.total);
}
