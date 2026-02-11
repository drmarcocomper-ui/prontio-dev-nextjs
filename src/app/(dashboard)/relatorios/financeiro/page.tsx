import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MonthFilter } from "./month-filter";
import { ExportCsvButton, type TransacaoCSV } from "./export-csv-button";
import {
  CATEGORIA_LABELS,
  PAGAMENTO_LABELS,
  STATUS_STYLES,
  formatCurrency,
  formatDate,
  type Transacao,
} from "../../financeiro/constants";

export default async function RelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;

  const now = new Date();
  const currentMonth = mes || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = currentMonth.split("-").map(Number);
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const supabase = await createClient();

  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("id, tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, created_at, pacientes(nome)")
    .gte("data", startDate)
    .lte("data", endDate)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  const items = (transacoes ?? []) as unknown as Transacao[];

  const totalReceitas = items
    .filter((t) => t.tipo === "receita" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesas = items
    .filter((t) => t.tipo === "despesa" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  const monthLabel = new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Breakdown por categoria
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

  const categoriaBreakdown = Array.from(categoriaMap.entries())
    .map(([cat, vals]) => ({
      categoria: cat,
      label: cat === "sem_categoria" ? "Sem categoria" : (CATEGORIA_LABELS[cat] ?? cat),
      receitas: vals.receitas,
      despesas: vals.despesas,
      saldo: vals.receitas - vals.despesas,
    }))
    .sort((a, b) => (b.receitas + b.despesas) - (a.receitas + a.despesas));

  // Breakdown por forma de pagamento
  const pagamentoMap = new Map<string, { qtd: number; total: number }>();
  for (const t of items) {
    if (t.status === "cancelado") continue;
    const pg = t.forma_pagamento ?? "nao_informado";
    const entry = pagamentoMap.get(pg) ?? { qtd: 0, total: 0 };
    entry.qtd += 1;
    entry.total += t.valor;
    pagamentoMap.set(pg, entry);
  }

  const pagamentoBreakdown = Array.from(pagamentoMap.entries())
    .map(([pg, vals]) => ({
      forma: pg,
      label: pg === "nao_informado" ? "Não informado" : (PAGAMENTO_LABELS[pg] ?? pg),
      qtd: vals.qtd,
      total: vals.total,
    }))
    .sort((a, b) => b.total - a.total);

  // CSV data
  const csvData: TransacaoCSV[] = items.map((t) => ({
    data: formatDate(t.data),
    tipo: t.tipo === "receita" ? "Receita" : "Despesa",
    categoria: t.categoria ? (CATEGORIA_LABELS[t.categoria] ?? t.categoria) : "",
    descricao: t.descricao,
    valor: t.valor.toFixed(2).replace(".", ","),
    forma_pagamento: t.forma_pagamento ? (PAGAMENTO_LABELS[t.forma_pagamento] ?? t.forma_pagamento) : "",
    status: t.status === "pago" ? "Pago" : t.status === "pendente" ? "Pendente" : "Cancelado",
    paciente: t.pacientes?.nome ?? "",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Financeiro</h1>
          <p className="mt-1 text-sm capitalize text-gray-500">{monthLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthFilter currentMonth={currentMonth} />
          <ExportCsvButton data={csvData} month={currentMonth} />
          <Link
            href={`/relatorios/financeiro/imprimir?mes=${currentMonth}`}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Imprimir
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Total Receitas</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(totalReceitas)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Total Despesas</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(totalDespesas)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Saldo</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              saldo >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatCurrency(saldo)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Transações</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
      </div>

      {/* Breakdown por categoria */}
      {categoriaBreakdown.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Por categoria</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoria
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Receitas
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Despesas
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categoriaBreakdown.map((row) => (
                <tr key={row.categoria}>
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900">
                    {row.label}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-emerald-600">
                    {row.receitas > 0 ? formatCurrency(row.receitas) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-red-600">
                    {row.despesas > 0 ? formatCurrency(row.despesas) : "—"}
                  </td>
                  <td
                    className={`whitespace-nowrap px-5 py-3 text-right text-sm font-semibold ${
                      row.saldo >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(row.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Breakdown por forma de pagamento */}
      {pagamentoBreakdown.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Por forma de pagamento</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Forma
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Qtd
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagamentoBreakdown.map((row) => (
                <tr key={row.forma}>
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900">
                    {row.label}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-gray-600">
                    {row.qtd}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de transações */}
      {items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Transações do período</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Data
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Descrição
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoria
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pagamento
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {formatDate(t.data)}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{t.descricao}</p>
                    {t.pacientes && (
                      <p className="text-xs text-gray-500">{t.pacientes.nome}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {t.categoria ? (CATEGORIA_LABELS[t.categoria] ?? t.categoria) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {t.forma_pagamento ? (PAGAMENTO_LABELS[t.forma_pagamento] ?? t.forma_pagamento) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[t.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t.status === "pago" ? "Pago" : t.status === "pendente" ? "Pendente" : "Cancelado"}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-5 py-3.5 text-right text-sm font-semibold ${
                      t.tipo === "receita" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.tipo === "despesa" && "- "}
                    {formatCurrency(t.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            Nenhuma transação neste período
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecione outro mês ou registre transações no módulo financeiro.
          </p>
        </div>
      )}
    </div>
  );
}
