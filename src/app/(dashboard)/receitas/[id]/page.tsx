import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/delete-button";
import { excluirReceita } from "../actions";
import {
  type Receita,
  TIPO_LABELS,
  formatDateLong,
  getInitials,
} from "../types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("receitas")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Receita - ${nome}` : "Receita" };
}

export default async function ReceitaDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: receita } = await supabase
    .from("receitas")
    .select(
      "id, data, tipo, medicamentos, observacoes, created_at, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!receita) {
    notFound();
  }

  const r = receita as unknown as Receita;

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/receitas"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Receitas
      </Link>

      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            {getInitials(r.pacientes.nome)}
          </div>
          <div>
            <Link
              href={`/pacientes/${r.pacientes.id}`}
              className="text-lg font-bold text-gray-900 hover:text-sky-600"
            >
              {r.pacientes.nome}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="capitalize">{formatDateLong(r.data)}</span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {TIPO_LABELS[r.tipo] ?? r.tipo}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/receitas/${r.id}/imprimir`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Imprimir
          </Link>
          <Link
            href={`/receitas/${r.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton onDelete={excluirReceita.bind(null, r.id)} title="Excluir receita" description="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir receita. Tente novamente." />
        </div>
      </div>

      {/* Medicamentos */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          Medicamentos
        </h2>
        <div className="mt-4 rounded-lg bg-gray-50 p-3 sm:p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {r.medicamentos}
          </p>
        </div>
      </div>

      {/* Observações */}
      {r.observacoes && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900">Observações</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {r.observacoes}
          </p>
        </div>
      )}

      {/* Footer info */}
      <p className="text-xs text-gray-400">
        Registro criado em{" "}
        {new Date(r.created_at).toLocaleString("pt-BR", {
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
