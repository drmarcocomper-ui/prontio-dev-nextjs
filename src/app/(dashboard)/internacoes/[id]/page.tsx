import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { DeleteButton } from "@/components/delete-button";
import { excluirInternacao } from "../actions";
import {
  type Internacao,
  formatDateLong,
  formatDateMedium,
  getInitials,
  CARATER_LABELS,
  TIPO_INTERNACAO_LABELS,
  REGIME_LABELS,
  INDICACAO_ACIDENTE_LABELS,
} from "../types";
import { formatDateTime } from "@/lib/format";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Internação" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("internacoes")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Internação - ${nome}` : "Internação" };
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

export default async function InternacaoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: internacao } = await supabase
    .from("internacoes")
    .select(
      "id, data, hospital_nome, data_sugerida_internacao, carater_atendimento, tipo_internacao, regime_internacao, diarias_solicitadas, previsao_opme, previsao_quimioterapico, indicacao_clinica, cid_principal, cid_2, cid_3, cid_4, indicacao_acidente, procedimentos, observacoes, created_at, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!internacao) {
    notFound();
  }

  const i = internacao as unknown as Internacao;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Pacientes", href: "/pacientes" },
        { label: i.pacientes.nome, href: `/pacientes/${i.pacientes.id}` },
        { label: "Internação" },
      ]} />

      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700">
            {getInitials(i.pacientes.nome)}
          </div>
          <div>
            <Link
              href={`/pacientes/${i.pacientes.id}`}
              className="text-lg font-bold text-gray-900 hover:text-primary-600"
            >
              {i.pacientes.nome}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {i.data && (
                <p className="text-sm text-gray-500 capitalize">
                  {formatDateLong(i.data)}
                </p>
              )}
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                Internação
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/internacoes/${i.id}/imprimir`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Imprimir
          </Link>
          <Link
            href={`/internacoes/${i.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton onDelete={excluirInternacao.bind(null, i.id)} title="Excluir internação" description="Tem certeza que deseja excluir esta internação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir internação. Tente novamente." />
        </div>
      </div>

      {/* Dados da Internação */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
          </svg>
          Dados da internação
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Hospital" value={i.hospital_nome} />
          <InfoItem label="Data sugerida" value={i.data_sugerida_internacao ? formatDateMedium(i.data_sugerida_internacao) : null} />
          <InfoItem label="Caráter" value={i.carater_atendimento ? CARATER_LABELS[i.carater_atendimento] : null} />
          <InfoItem label="Tipo de internação" value={i.tipo_internacao ? TIPO_INTERNACAO_LABELS[i.tipo_internacao] : null} />
          <InfoItem label="Regime" value={i.regime_internacao ? REGIME_LABELS[i.regime_internacao] : null} />
          <InfoItem label="Diárias solicitadas" value={i.diarias_solicitadas?.toString()} />
          <InfoItem label="Previsão de OPME" value={i.previsao_opme ? "Sim" : "Não"} />
          <InfoItem label="Previsão de quimioterápico" value={i.previsao_quimioterapico ? "Sim" : "Não"} />
        </dl>
      </div>

      {/* Indicação Clínica */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Indicação clínica</h2>
        <div className="mt-4 rounded-lg bg-gray-50 p-3 sm:p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {i.indicacao_clinica}
          </p>
        </div>
      </div>

      {/* CIDs */}
      {(i.cid_principal || i.cid_2 || i.cid_3 || i.cid_4 || i.indicacao_acidente) && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900">CIDs e indicação de acidente</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="CID Principal" value={i.cid_principal} />
            <InfoItem label="CID 2" value={i.cid_2} />
            <InfoItem label="CID 3" value={i.cid_3} />
            <InfoItem label="CID 4" value={i.cid_4} />
          </dl>
          {i.indicacao_acidente && (
            <div className="mt-4">
              <InfoItem label="Indicação de acidente" value={INDICACAO_ACIDENTE_LABELS[i.indicacao_acidente]} />
            </div>
          )}
        </div>
      )}

      {/* Procedimentos */}
      {i.procedimentos && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900">Procedimentos</h2>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 sm:p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {i.procedimentos}
            </p>
          </div>
        </div>
      )}

      {/* Observações */}
      {i.observacoes && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900">Observações</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {i.observacoes}
          </p>
        </div>
      )}

      {/* Footer info */}
      <p className="text-xs text-gray-400">
        Registro criado em {formatDateTime(i.created_at)}
      </p>
    </div>
  );
}
