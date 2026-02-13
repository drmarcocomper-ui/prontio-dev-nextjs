import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/delete-button";
import { excluirTransacao } from "../actions";
import {
  CATEGORIA_LABELS,
  PAGAMENTO_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatCurrency,
  formatDateLong,
  getInitials,
  type TransacaoFull as Transacao,
} from "../constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("transacoes")
    .select("descricao")
    .eq("id", id)
    .single();
  return { title: data?.descricao ?? "Transação" };
}

export default async function TransacaoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: transacao } = await supabase
    .from("transacoes")
    .select(
      "id, tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, created_at, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!transacao) {
    notFound();
  }

  const t = transacao as unknown as Transacao;

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/financeiro"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Financeiro
      </Link>

      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                t.tipo === "receita"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {t.tipo === "receita" ? "Receita" : "Despesa"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[t.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {STATUS_LABELS[t.status] ?? t.status}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold text-gray-900">{t.descricao}</h1>
          <p className="mt-1 text-sm capitalize text-gray-500">{formatDateLong(t.data)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/financeiro/${t.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton onDelete={excluirTransacao.bind(null, t.id)} title="Excluir transação" description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir transação. Tente novamente." />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Detalhes da transação
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Valor
            </h3>
            <p
              className={`mt-1 text-lg font-bold ${
                t.tipo === "receita" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {t.tipo === "despesa" && "- "}
              {formatCurrency(t.valor)}
            </p>
          </div>

          {t.categoria && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Categoria
              </h3>
              <p className="mt-1 text-sm text-gray-800">
                {CATEGORIA_LABELS[t.categoria] ?? t.categoria}
              </p>
            </div>
          )}

          {t.forma_pagamento && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Forma de pagamento
              </h3>
              <p className="mt-1 text-sm text-gray-800">
                {PAGAMENTO_LABELS[t.forma_pagamento] ?? t.forma_pagamento}
              </p>
            </div>
          )}

          {t.pacientes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Paciente
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  {getInitials(t.pacientes.nome)}
                </div>
                <Link
                  href={`/pacientes/${t.pacientes.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-primary-600"
                >
                  {t.pacientes.nome}
                </Link>
              </div>
            </div>
          )}
        </div>

        {t.observacoes && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Observações
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {t.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="text-xs text-gray-400">
        Registro criado em{" "}
        {new Date(t.created_at).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
