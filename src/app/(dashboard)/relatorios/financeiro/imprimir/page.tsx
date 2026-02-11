import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";
import {
  CATEGORIA_LABELS,
  PAGAMENTO_LABELS,
  formatCurrency,
  formatDate,
  type Transacao,
} from "../../../financeiro/constants";

export default async function ImprimirRelatorioPage({
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

  const [{ data: transacoes }, { data: configs }] = await Promise.all([
    supabase
      .from("transacoes")
      .select("id, tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, created_at, pacientes(nome)")
      .gte("data", startDate)
      .lte("data", endDate)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("configuracoes")
      .select("chave, valor")
      .in("chave", [
        "nome_consultorio",
        "endereco_consultorio",
        "telefone_consultorio",
        "nome_profissional",
        "especialidade",
        "crm",
      ]),
  ]);

  const items = (transacoes ?? []) as unknown as Transacao[];

  const cfg: Record<string, string> = {};
  (configs ?? []).forEach((c: { chave: string; valor: string }) => {
    cfg[c.chave] = c.valor;
  });

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
        <a
          href={`/relatorios/financeiro?mes=${currentMonth}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar para relatório
        </a>
        <PrintButton />
      </div>

      {/* Report Content */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-8">
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
                  <th className="py-2 text-left font-medium text-gray-500">Categoria</th>
                  <th className="py-2 text-right font-medium text-gray-500">Receitas</th>
                  <th className="py-2 text-right font-medium text-gray-500">Despesas</th>
                  <th className="py-2 text-right font-medium text-gray-500">Saldo</th>
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
                  <th className="py-2 text-left font-medium text-gray-500">Forma</th>
                  <th className="py-2 text-right font-medium text-gray-500">Qtd</th>
                  <th className="py-2 text-right font-medium text-gray-500">Total</th>
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
                  <th className="py-2 text-left font-medium text-gray-500">Data</th>
                  <th className="py-2 text-left font-medium text-gray-500">Descrição</th>
                  <th className="py-2 text-left font-medium text-gray-500">Categoria</th>
                  <th className="py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="py-2 text-right font-medium text-gray-500">Valor</th>
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
                      {t.status === "pago" ? "Pago" : t.status === "pendente" ? "Pendente" : "Cancelado"}
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
