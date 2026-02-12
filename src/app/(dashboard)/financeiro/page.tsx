import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { SortableHeader } from "@/components/sortable-header";
import { Filters } from "./filters";
import { DeleteButton } from "@/components/delete-button";
import { excluirTransacao } from "./actions";
import {
  CATEGORIA_LABELS,
  PAGAMENTO_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatCurrency,
  formatDate,
  type TransacaoListItem,
} from "./constants";

export const metadata: Metadata = { title: "Financeiro" };

const PAGE_SIZE = 20;

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string;
    tipo?: string;
    pagina?: string;
    ordem?: string;
    dir?: string;
  }>;
}) {
  const { mes, tipo, pagina, ordem, dir } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);
  const sortColumn = ordem || "data";
  const sortDir = dir === "asc" ? "asc" : "desc";
  const ascending = sortDir === "asc";

  const now = new Date();
  const currentMonth = mes || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = currentMonth.split("-").map(Number);
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const supabase = await createClient();

  let query = supabase
    .from("transacoes")
    .select("id, tipo, categoria, descricao, valor, data, forma_pagamento, status, pacientes(nome)", { count: "exact" })
    .gte("data", startDate)
    .lte("data", endDate)
    .order(sortColumn, { ascending })
    .order("created_at", { ascending: false });

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: transacoes, count } = await query;
  const items = (transacoes ?? []) as unknown as TransacaoListItem[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // Summary query (all items for the month, not just current page)
  let summaryQuery = supabase
    .from("transacoes")
    .select("tipo, valor, status")
    .gte("data", startDate)
    .lte("data", endDate);

  if (tipo) {
    summaryQuery = summaryQuery.eq("tipo", tipo);
  }

  const { data: allTransacoes } = await summaryQuery;
  const allItems = allTransacoes ?? [];

  const totalReceitas = allItems
    .filter((t) => t.tipo === "receita" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesas = allItems
    .filter((t) => t.tipo === "despesa" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  const monthLabel = new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const sp: Record<string, string> = {};
  if (mes) sp.mes = mes;
  if (tipo) sp.tipo = tipo;
  if (ordem) sp.ordem = ordem;
  if (dir) sp.dir = dir;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="mt-1 text-sm capitalize text-gray-500">{monthLabel}</p>
        </div>
        <Link
          href="/financeiro/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova transação
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Receitas</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(totalReceitas)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Despesas</p>
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
      </div>

      {/* Filters */}
      <Filters currentMonth={currentMonth} currentType={tipo ?? ""} />

      {/* Transactions Table */}
      {items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader
                  label="Data"
                  column="data"
                  currentColumn={sortColumn}
                  currentDirection={sortDir}
                  basePath="/financeiro"
                  searchParams={sp}
                  className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                />
                <SortableHeader
                  label="Descrição"
                  column="descricao"
                  currentColumn={sortColumn}
                  currentDirection={sortDir}
                  basePath="/financeiro"
                  searchParams={sp}
                  className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                />
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoria
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pagamento
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <SortableHeader
                  label="Valor"
                  column="valor"
                  currentColumn={sortColumn}
                  currentDirection={sortDir}
                  basePath="/financeiro"
                  searchParams={sp}
                  className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                />
                <th scope="col" className="w-10 px-3 py-3">
                  <span className="sr-only">Ações</span>
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
                    <Link
                      href={`/financeiro/${t.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-sky-600"
                    >
                      {t.descricao}
                    </Link>
                    {t.pacientes && (
                      <p className="text-xs text-gray-500">
                        {t.pacientes.nome}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {t.categoria ? (CATEGORIA_LABELS[t.categoria] ?? t.categoria) : "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {t.forma_pagamento ? (PAGAMENTO_LABELS[t.forma_pagamento] ?? t.forma_pagamento) : "\u2014"}
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
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <DeleteButton onDelete={excluirTransacao.bind(null, t.id)} title="Excluir transação" description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir transação. Tente novamente." variant="icon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <svg aria-hidden="true" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            Nenhuma transação neste período
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Registre uma receita ou despesa para começar.
          </p>
          <Link
            href="/financeiro/novo"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova transação
          </Link>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        basePath="/financeiro"
        searchParams={sp}
      />
    </div>
  );
}
