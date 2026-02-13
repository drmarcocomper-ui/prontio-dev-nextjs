import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyStateIllustration } from "@/components/empty-state";
import { MonthFilter } from "./month-filter";
import { ExportCsvButton, type TransacaoCSV } from "./export-csv-button";
import {
  CATEGORIA_LABELS,
  PAGAMENTO_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatCurrency,
  formatDate,
  type TransacaoListItem,
} from "../../financeiro/constants";
import {
  REPORT_SELECT,
  getMonthDateRange,
  computeKPIs,
  getMonthLabel,
  aggregateByCategoria,
  aggregateByPagamento,
} from "./utils";

export const metadata: Metadata = { title: "Relatório Financeiro" };

export default async function RelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const { currentMonth, year, month, startDate, endDate } = getMonthDateRange(mes);

  const supabase = await createClient();

  const { data: transacoes } = await supabase
    .from("transacoes")
    .select(REPORT_SELECT)
    .gte("data", startDate)
    .lte("data", endDate)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  const items = (transacoes ?? []) as unknown as TransacaoListItem[];

  const { totalReceitas, totalDespesas, saldo } = computeKPIs(items);
  const monthLabel = getMonthLabel(year, month);
  const categoriaBreakdown = aggregateByCategoria(items);
  const pagamentoBreakdown = aggregateByPagamento(items);

  // CSV data
  const csvData: TransacaoCSV[] = items.map((t) => ({
    data: formatDate(t.data),
    tipo: t.tipo === "receita" ? "Receita" : "Despesa",
    categoria: t.categoria ? (CATEGORIA_LABELS[t.categoria] ?? t.categoria) : "",
    descricao: t.descricao,
    valor: t.valor.toFixed(2).replace(".", ","),
    forma_pagamento: t.forma_pagamento ? (PAGAMENTO_LABELS[t.forma_pagamento] ?? t.forma_pagamento) : "",
    status: STATUS_LABELS[t.status] ?? t.status,
    paciente: t.pacientes?.nome ?? "",
  }));

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
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
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Imprimir
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Total Receitas</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(totalReceitas)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Total Despesas</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(totalDespesas)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Saldo</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              saldo >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatCurrency(saldo)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Transações</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
      </div>

      {/* Breakdown por categoria */}
      {categoriaBreakdown.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold text-gray-900">Por categoria</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoria
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Receitas
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Despesas
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categoriaBreakdown.map((row) => (
                <tr key={row.categoria} className="even:bg-gray-50/50">
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
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold text-gray-900">Por forma de pagamento</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Forma
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Qtd
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagamentoBreakdown.map((row) => (
                <tr key={row.forma} className="even:bg-gray-50/50">
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
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold text-gray-900">Transações do período</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Data
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Descrição
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoria
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pagamento
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((t) => (
                <tr key={t.id} className="transition-colors even:bg-gray-50/50 hover:bg-primary-50/50">
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
                      {STATUS_LABELS[t.status] ?? t.status}
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
          <EmptyStateIllustration type="financeiro" />
          <h3 className="mt-6 text-sm font-semibold text-gray-900">
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
