import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { EmptyStateIllustration } from "@/components/empty-state";
import { MonthFilter } from "./month-filter";
import { ExportCsvButton, type AgendamentoCSV } from "./export-csv-button";
import { ReportNav } from "../components/report-nav";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  REPORT_SELECT,
  getMonthDateRange,
  getMonthLabel,
  computeKPIs,
  aggregateByProfissional,
  aggregateByTipo,
  aggregateByDiaSemana,
  buildTipoChartData,
  buildDiaSemanaChartData,
  buildStatusChartData,
  TIPO_LABELS,
  STATUS_LABELS,
  type AgendamentoReport,
} from "./utils";
import { redirect } from "next/navigation";
import { getClinicaAtual } from "@/lib/clinica";

const ChartSkeleton = () => (
  <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
);
const AtendimentosPorTipoChart = dynamic(
  () => import("./charts").then((m) => ({ default: m.AtendimentosPorTipoChart })),
  { loading: ChartSkeleton },
);
const AtendimentosPorDiaSemanaChart = dynamic(
  () => import("./charts").then((m) => ({ default: m.AtendimentosPorDiaSemanaChart })),
  { loading: ChartSkeleton },
);
const DistribuicaoStatusChart = dynamic(
  () => import("./charts").then((m) => ({ default: m.DistribuicaoStatusChart })),
  { loading: ChartSkeleton },
);

export const metadata: Metadata = { title: "Relatório de Produtividade" };

export default async function RelatorioProdutividadePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const { currentMonth, year, month, startDate, endDate } = getMonthDateRange(mes);

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) redirect("/login");

  const [{ data: agendamentos }, { data: configRows }] = await Promise.all([
    supabase
      .from("agendamentos")
      .select(REPORT_SELECT)
      .eq("clinica_id", ctx.clinicaId)
      .gte("data", startDate)
      .lte("data", endDate)
      .order("data", { ascending: false })
      .order("hora_inicio", { ascending: true }),
    supabase
      .from("configuracoes")
      .select("valor, user_id")
      .eq("clinica_id", ctx.clinicaId)
      .eq("chave", "nome_profissional"),
  ]);

  const items = (agendamentos ?? []) as unknown as AgendamentoReport[];

  // Build medico_id -> nome map from configuracoes
  const nomeMap = new Map<string, string>();
  if (configRows) {
    for (const row of configRows as unknown as { valor: string; user_id: string }[]) {
      nomeMap.set(row.user_id, row.valor);
    }
  }

  const kpis = computeKPIs(items, startDate, endDate);
  const monthLabel = getMonthLabel(year, month);
  const profissionalBreakdown = aggregateByProfissional(items, nomeMap);
  const tipoBreakdown = aggregateByTipo(items);
  const diaSemanaBreakdown = aggregateByDiaSemana(items, startDate, endDate);

  const tipoChartData = buildTipoChartData(items);
  const diaSemanaChartData = buildDiaSemanaChartData(items);
  const statusChartData = buildStatusChartData(items);

  // CSV data
  const csvData: AgendamentoCSV[] = items.map((a) => ({
    data: formatDate(a.data),
    horario: `${a.hora_inicio.slice(0, 5)}-${a.hora_fim.slice(0, 5)}`,
    paciente: a.pacientes?.nome ?? "",
    profissional: a.pacientes?.medico_id
      ? (nomeMap.get(a.pacientes.medico_id) ?? "")
      : "",
    tipo: a.tipo ? (TIPO_LABELS[a.tipo] ?? a.tipo) : "",
    status: STATUS_LABELS[a.status] ?? a.status,
    valor: a.valor != null ? a.valor.toFixed(2).replace(".", ",") : "",
  }));

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Produtividade</h1>
          <ReportNav />
          <p className="text-sm capitalize text-gray-500">{monthLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthFilter currentMonth={currentMonth} />
          <ExportCsvButton data={csvData} month={currentMonth} />
          <Link
            href={`/relatorios/produtividade/imprimir?mes=${currentMonth}`}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Total Agendamentos</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{kpis.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Atendidos</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{kpis.atendidos}</p>
          <p className="mt-0.5 text-xs text-gray-400">{kpis.taxaConclusao.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Cancelamentos</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{kpis.cancelamentos}</p>
          <p className="mt-0.5 text-xs text-gray-400">{kpis.taxaCancelamento.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Faltas</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{kpis.faltas}</p>
          <p className="mt-0.5 text-xs text-gray-400">{kpis.taxaFalta.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Média Diária</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{kpis.mediaDiaria.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-sm font-medium text-gray-500">Receita</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(kpis.receita)}
          </p>
        </div>
      </div>

      {/* Charts */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <AtendimentosPorTipoChart data={tipoChartData} />
          <AtendimentosPorDiaSemanaChart data={diaSemanaChartData} />
          <DistribuicaoStatusChart data={statusChartData} />
        </div>
      )}

      {/* Breakdown por profissional */}
      {profissionalBreakdown.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold text-gray-900">Por profissional</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Profissional
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Atendidos
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cancel.
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Faltas
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Receita
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {profissionalBreakdown.map((row) => (
                <tr key={row.medicoId} className="even:bg-gray-50/50">
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900">
                    {row.nome}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-gray-600">
                    {row.total}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-emerald-600">
                    {row.atendidos}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-red-600">
                    {row.cancelamentos}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-amber-600">
                    {row.faltas}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(row.receita)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Breakdown por tipo */}
      {tipoBreakdown.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold text-gray-900">Por tipo de atendimento</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Atendidos
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cancel.
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Faltas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tipoBreakdown.map((row) => (
                <tr key={row.tipo} className="even:bg-gray-50/50">
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900">
                    {row.label}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-gray-600">
                    {row.total}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-emerald-600">
                    {row.atendidos}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-red-600">
                    {row.cancelamentos}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-amber-600">
                    {row.faltas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Breakdown por dia da semana */}
      {diaSemanaBreakdown.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold text-gray-900">Por dia da semana</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Dia
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Atendidos
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Média Diária
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {diaSemanaBreakdown.map((row) => (
                <tr key={row.dia} className="even:bg-gray-50/50">
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900">
                    {row.label}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-gray-600">
                    {row.total}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-emerald-600">
                    {row.atendidos}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold text-gray-900">
                    {row.mediaDiaria.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
          <EmptyStateIllustration type="agenda" />
          <h3 className="mt-6 text-sm font-semibold text-gray-900">
            Nenhum agendamento neste período
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecione outro mês ou registre agendamentos no módulo de agenda.
          </p>
        </div>
      )}
    </div>
  );
}
