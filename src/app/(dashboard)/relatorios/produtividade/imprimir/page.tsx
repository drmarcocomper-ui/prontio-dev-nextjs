import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { PrintButton } from "./print-button";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  REPORT_SELECT,
  getMonthDateRange,
  getMonthLabel,
  computeKPIs,
  aggregateByProfissional,
  aggregateByTipo,
  aggregateByDiaSemana,
  TIPO_LABELS,
  STATUS_LABELS,
  type AgendamentoReport,
} from "../utils";
import { redirect } from "next/navigation";
import { getClinicaAtual } from "@/lib/clinica";

export const metadata: Metadata = { title: "Imprimir Relatório de Produtividade" };

export default async function ImprimirProdutividadePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const { currentMonth, year, month, startDate, endDate } = getMonthDateRange(mes);

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) redirect("/login");

  const [{ data: agendamentos }, { data: configRows }, { data: clinica }] =
    await Promise.all([
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
      supabase
        .from("clinicas")
        .select("nome, endereco, telefone")
        .eq("id", ctx.clinicaId)
        .single(),
    ]);

  const items = (agendamentos ?? []) as unknown as AgendamentoReport[];

  const nomeMap = new Map<string, string>();
  if (configRows) {
    for (const row of configRows as unknown as { valor: string; user_id: string }[]) {
      nomeMap.set(row.user_id, row.valor);
    }
  }

  const cfg: Record<string, string> = {};
  if (clinica) {
    cfg.nome_consultorio = (clinica as { nome: string; endereco: string | null; telefone: string | null }).nome;
    cfg.endereco_consultorio = (clinica as { endereco: string | null }).endereco ?? "";
    cfg.telefone_consultorio = (clinica as { telefone: string | null }).telefone ?? "";
  }

  const kpis = computeKPIs(items, startDate, endDate);
  const monthLabel = getMonthLabel(year, month);
  const profissionalBreakdown = aggregateByProfissional(items, nomeMap);
  const tipoBreakdown = aggregateByTipo(items);
  const diaSemanaBreakdown = aggregateByDiaSemana(items, startDate, endDate);

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
          { label: "Relatórios", href: "/relatorios/produtividade" },
          { label: "Produtividade", href: `/relatorios/produtividade?mes=${currentMonth}` },
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
            Relatório de Produtividade
          </h2>
          <p className="mt-1 text-sm capitalize text-gray-500">{monthLabel}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Total</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{kpis.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Atendidos</p>
            <p className="mt-1 text-lg font-bold text-emerald-600">
              {kpis.atendidos} ({kpis.taxaConclusao.toFixed(1)}%)
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Cancelamentos</p>
            <p className="mt-1 text-lg font-bold text-red-600">
              {kpis.cancelamentos} ({kpis.taxaCancelamento.toFixed(1)}%)
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Faltas</p>
            <p className="mt-1 text-lg font-bold text-amber-600">
              {kpis.faltas} ({kpis.taxaFalta.toFixed(1)}%)
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Média Diária</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{kpis.mediaDiaria.toFixed(1)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">Receita</p>
            <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(kpis.receita)}</p>
          </div>
        </div>

        {/* Por profissional */}
        {profissionalBreakdown.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Por profissional</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Profissional</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Total</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Atendidos</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Cancel.</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Faltas</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profissionalBreakdown.map((row) => (
                  <tr key={row.medicoId}>
                    <td className="py-2 font-medium text-gray-900">{row.nome}</td>
                    <td className="py-2 text-right text-gray-600">{row.total}</td>
                    <td className="py-2 text-right text-emerald-600">{row.atendidos}</td>
                    <td className="py-2 text-right text-red-600">{row.cancelamentos}</td>
                    <td className="py-2 text-right text-amber-600">{row.faltas}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">{formatCurrency(row.receita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Por tipo */}
        {tipoBreakdown.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Por tipo de atendimento</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Tipo</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Total</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Atendidos</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Cancel.</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Faltas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tipoBreakdown.map((row) => (
                  <tr key={row.tipo}>
                    <td className="py-2 font-medium text-gray-900">{row.label}</td>
                    <td className="py-2 text-right text-gray-600">{row.total}</td>
                    <td className="py-2 text-right text-emerald-600">{row.atendidos}</td>
                    <td className="py-2 text-right text-red-600">{row.cancelamentos}</td>
                    <td className="py-2 text-right text-amber-600">{row.faltas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Por dia da semana */}
        {diaSemanaBreakdown.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Por dia da semana</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th scope="col" className="py-2 text-left font-medium text-gray-500">Dia</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Total</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Atendidos</th>
                  <th scope="col" className="py-2 text-right font-medium text-gray-500">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {diaSemanaBreakdown.map((row) => (
                  <tr key={row.dia}>
                    <td className="py-2 font-medium text-gray-900">{row.label}</td>
                    <td className="py-2 text-right text-gray-600">{row.total}</td>
                    <td className="py-2 text-right text-emerald-600">{row.atendidos}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">{row.mediaDiaria.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            Nenhum agendamento neste período.
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
