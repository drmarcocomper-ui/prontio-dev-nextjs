import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { DeleteButton } from "@/components/delete-button";
import { getMedicoId } from "@/lib/clinica";
import { excluirExame } from "../actions";
import {
  type Exame,
  TIPO_LABELS,
  formatDateLong,
  getInitials,
} from "../types";
import { formatDateTime } from "@/lib/format";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Solicitação de Exame" };
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { title: "Solicitação de Exame" };
  }
  const { data } = await supabase
    .from("solicitacoes_exames")
    .select("pacientes(nome)")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Exame - ${nome}` : "Solicitação de Exame" };
}

export default async function ExameDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    notFound();
  }

  const { data: exame } = await supabase
    .from("solicitacoes_exames")
    .select(
      "id, data, tipo, exames, indicacao_clinica, operadora, numero_carteirinha, observacoes, created_at, pacientes(id, nome)"
    )
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  if (!exame) {
    notFound();
  }

  const e = exame as unknown as Exame;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Pacientes", href: "/pacientes" },
        { label: e.pacientes.nome, href: `/pacientes/${e.pacientes.id}` },
        { label: "Solicitação de exame" },
      ]} />

      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-cyan-700">
            {getInitials(e.pacientes.nome)}
          </div>
          <div>
            <Link
              href={`/pacientes/${e.pacientes.id}`}
              className="text-lg font-bold text-gray-900 hover:text-primary-600"
            >
              {e.pacientes.nome}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="capitalize">{formatDateLong(e.data)}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                e.tipo === "convenio"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {TIPO_LABELS[e.tipo] ?? e.tipo}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/exames/${e.id}/imprimir`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Imprimir
          </Link>
          <Link
            href={`/exames/${e.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton onDelete={excluirExame.bind(null, e.id)} title="Excluir solicitação" description="Tem certeza que deseja excluir esta solicitação de exame? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir solicitação. Tente novamente." />
        </div>
      </div>

      {/* Dados do convênio */}
      {e.tipo === "convenio" && (e.operadora || e.numero_carteirinha) && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
            </svg>
            Dados do convênio
          </h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {e.operadora && (
              <div>
                <dt className="text-xs font-medium text-gray-500">Operadora</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{e.operadora}</dd>
              </div>
            )}
            {e.numero_carteirinha && (
              <div>
                <dt className="text-xs font-medium text-gray-500">N° Carteirinha</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{e.numero_carteirinha}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Exames */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          Exames solicitados
        </h2>
        <div className="mt-4 rounded-lg bg-gray-50 p-3 sm:p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {e.exames}
          </p>
        </div>
      </div>

      {/* Indicação clínica */}
      {e.indicacao_clinica && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900">Indicação clínica</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {e.indicacao_clinica}
          </p>
        </div>
      )}

      {/* Observações */}
      {e.observacoes && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900">Observações</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {e.observacoes}
          </p>
        </div>
      )}

      {/* Footer info */}
      <p className="text-xs text-gray-400">
        Registro criado em {formatDateTime(e.created_at)}
      </p>
    </div>
  );
}
