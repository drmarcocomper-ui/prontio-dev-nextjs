import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { StatusBadge } from "../status-badge";
import { DeleteButton } from "@/components/delete-button";
import { getClinicaAtual } from "@/lib/clinica";
import { excluirAgendamento } from "../actions";
import { type Agendamento, TIPO_LABELS, formatTime, formatDateLong, getInitials } from "../types";
import { formatDateTime, formatCurrency } from "@/lib/format";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Agendamento" };
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { title: "Agendamento" };
  const { data } = await supabase
    .from("agendamentos")
    .select("pacientes(nome)")
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Agendamento - ${nome}` : "Agendamento" };
}

export default async function AgendamentoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) notFound();

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select(
      "id, data, hora_inicio, hora_fim, tipo, status, valor, observacoes, created_at, updated_at, pacientes(id, nome, telefone)"
    )
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();

  if (!agendamento) {
    notFound();
  }

  const ag = agendamento as unknown as Agendamento;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Agenda", href: `/agenda?data=${ag.data}` },
        { label: ag.pacientes.nome },
      ]} />

      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {getInitials(ag.pacientes.nome)}
          </div>
          <div>
            <Link
              href={`/pacientes/${ag.pacientes.id}`}
              className="text-lg font-bold text-gray-900 hover:text-primary-600"
            >
              {ag.pacientes.nome}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="capitalize">{formatDateLong(ag.data)}</span>
              {ag.tipo && (
                <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                  {TIPO_LABELS[ag.tipo] ?? ag.tipo}
                </span>
              )}
            </div>
          </div>
        </div>

        {!["atendido", "cancelado", "faltou"].includes(ag.status) && (
          <div className="flex items-center gap-2">
            <Link
              href={`/agenda/${ag.id}/editar`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Editar
            </Link>
            <DeleteButton onDelete={excluirAgendamento.bind(null, ag.id, ag.data)} title="Excluir agendamento" description="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir agendamento. Tente novamente." />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Detalhes do agendamento
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Horário
            </h3>
            <p className="mt-1 text-sm text-gray-800">
              {formatTime(ag.hora_inicio)} — {formatTime(ag.hora_fim)}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </h3>
            <div className="mt-1">
              <StatusBadge status={ag.status} />
            </div>
          </div>

          {ag.valor != null && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Valor
              </h3>
              <p className="mt-1 text-sm text-gray-800">{formatCurrency(ag.valor)}</p>
            </div>
          )}

          {ag.pacientes.telefone && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Telefone
              </h3>
              <p className="mt-1 text-sm text-gray-800">{ag.pacientes.telefone}</p>
            </div>
          )}
        </div>

        {ag.observacoes && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Observações
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {ag.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* Registrar evolução */}
      {["atendido", "em_atendimento"].includes(ag.status) && (
        <Link
          href={`/prontuarios/novo?paciente_id=${ag.pacientes.id}&paciente_nome=${encodeURIComponent(ag.pacientes.nome)}${ag.tipo ? `&tipo=${ag.tipo}` : ""}`}
          className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 p-4 transition-colors hover:border-violet-300 hover:bg-violet-100 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <svg aria-hidden="true" className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-sm font-semibold text-violet-700">Registrar evolução</span>
          </div>
          <svg aria-hidden="true" className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}

      {/* Footer info */}
      <p className="text-xs text-gray-400">
        Registro criado em {formatDateTime(ag.created_at)}
        {ag.updated_at && ag.updated_at !== ag.created_at && (
          <> · Atualizado em {formatDateTime(ag.updated_at)}</>
        )}
      </p>
    </div>
  );
}
