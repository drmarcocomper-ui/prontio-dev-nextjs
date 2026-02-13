import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { PrintButton } from "./print-button";
import {
  CATEGORIA_LABELS,
  STATUS_LABELS,
  formatCurrency,
  formatDate,
  type TransacaoListItem,
} from "../../../financeiro/constants";
import {
  REPORT_SELECT,
  getMonthDateRange,
  computeKPIs,
  getMonthLabel,
  aggregateByCategoria,
  aggregateByPagamento,
} from "../utils";
import { getClinicaAtual } from "@/lib/clinica";

export const metadata: Metadata = { title: "Imprimir Relatório" };

export default async function ImprimirRelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const { currentMonth, year, month, startDate, endDate } = getMonthDateRange(mes);

  const supabase = await createClient();
  const ctx = await getClinicaAtual();

  const [{ data: transacoes }, { data: clinica }] = await Promise.all([
    supabase
      .from("transacoes")
      .select(REPORT_SELECT)
      .eq("clinica_id", ctx?.clinicaId ?? "")
      .gte("data", startDate)
      .lte("data", endDate)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
    ctx?.clinicaId
      ? supabase
          .from("clinicas")
          .select("nome, endereco, telefone")
          .eq("id", ctx.clinicaId)
          .single()
      : { data: null },
  ]);

  const items = (transacoes ?? []) as unknown as TransacaoListItem[];

  const cfg: Record<string, string> = {};
  if (clinica) {
    cfg.nome_consultorio = (clinica as { nome: string; endereco: string | null; telefone: string | null }).nome;
    cfg.endereco_consultorio = (clinica as { endereco: string | null }).endereco ?? "";
    cfg.telefone_consultorio = (clinica as { telefone: string | null }).telefone ?? "";
  }

  const { totalReceitas, totalDespesas, saldo } = computeKPIs(items);
  const monthLabel = getMonthLabel(year, month);
  const categoriaBreakdown = aggregateByCategoria(items);
  const pagamentoBreakdown = aggregateByPagamento(items);

  return (
    <div className="mx-auto max-w-4xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
              @page { margin: 15mm; }
            }
          `,
        }}
      />

      {/* Actions (no-print) */}
      <div className="no-print mb-6 flex items-center justify-between">
        <Breadcrumb items={[
          { label: "Relatórios", href: "/relatorios/financeiro" },
          { label: "Financeiro", href: `/relatorios/financeiro?mes=${currentMonth}` },
          { label: "Imprimir" },
        ]} />
        <PrintButton />
      </div>

      {/* Report Content */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white shadow-sm p-8">
        {/* Header Consultório */}
        <div className="border-b border-gray-300 pb-6 text-center">
          {cfg.nome_consultorio && (
            <h1 className="text-xl font-bold text-gray-900">{cfg.nome_consultorio}</h1>
          )}
          {cfg.endereco_consultorio && (
            <p className="mt-1 text-sm text-gray-600">{cfg.endereco_consultorio}</p>
          )}
          {cfg.telefone_consultorio && (
            <p className="text-sm text-gray-600">Tel: {cfg.telefone_consultorio}</p>
          )}
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900">
            Relatório Financeiro
          </h2>
          <p className="mt-1 text-sm capitalize text-gray-500">{monthLabel}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Receitas</p>
            <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(totalReceitas)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Despesas</p>
            <p className="mt-1 text-lg font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Saldo</p>
            <p className={`mt-1 text-lg font-bold ${saldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(saldo)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Transações</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{items.length}</p>
          </div>
        </div>

        {/* Breakdown por categoria */}
        {categoriaBreakdown.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Por categoria</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Categoria</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Receitas</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Despesas</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoriaBreakdown.map((row) => (
                  <tr key={row.categoria}>
                    <td className="py-2 font-medium text-gray-900">{row.label}</td>
                    <td className="py-2 text-right text-emerald-600">
                      {row.receitas > 0 ? formatCurrency(row.receitas) : "—"}
                    </td>
                    <td className="py-2 text-right text-red-600">
                      {row.despesas > 0 ? formatCurrency(row.despesas) : "—"}
                    </td>
                    <td className={`py-2 text-right font-semibold ${row.saldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>
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
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Por forma de pagamento</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Forma</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Qtd</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagamentoBreakdown.map((row) => (
                  <tr key={row.forma}>
                    <td className="py-2 font-medium text-gray-900">{row.label}</td>
                    <td className="py-2 text-right text-gray-600">{row.qtd}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lista de transações */}
        {items.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Transações</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Data</th>
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Descrição</th>
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Categoria</th>
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Status</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap py-2 text-gray-600">{formatDate(t.data)}</td>
                    <td className="py-2 text-gray-900">
                      {t.descricao}
                      {t.pacientes && (
                        <span className="ml-1 text-xs text-gray-500">({t.pacientes.nome})</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-2 text-gray-600">
                      {t.categoria ? (CATEGORIA_LABELS[t.categoria] ?? t.categoria) : "—"}
                    </td>
                    <td className="whitespace-nowrap py-2 text-gray-600">
                      {STATUS_LABELS[t.status] ?? t.status}
                    </td>
                    <td
                      className={`whitespace-nowrap py-2 text-right font-semibold ${
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
        )}

        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            Nenhuma transação neste período.
          </p>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-400">
          Relatório gerado em{" "}
          {new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
