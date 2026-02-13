import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyStateIllustration } from "@/components/empty-state";
import { DatePicker } from "./date-picker";
import { StatusSelect } from "./status-select";
import { StatusBadge } from "./status-badge";
import { todayLocal } from "@/lib/date";
import { type Agendamento, TIPO_LABELS, formatTime, getInitials } from "./types";
import { getClinicaAtual } from "@/lib/clinica";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data: dataParam } = await searchParams;
  const currentDate = dataParam || todayLocal();

  const supabase = await createClient();
  const ctx = await getClinicaAtual();

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("id, paciente_id, data, hora_inicio, hora_fim, tipo, status, observacoes, pacientes(id, nome, telefone)")
    .eq("data", currentDate)
    .eq("clinica_id", ctx?.clinicaId ?? "")
    .order("hora_inicio");

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          </div>
        </div>
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar os dados. Tente recarregar a página.
        </div>
      </div>
    );
  }

  const items = (agendamentos ?? []) as unknown as Agendamento[];
  const total = items.length;
  const atendidos = items.filter((a) => a.status === "atendido").length;

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} agendamento{total !== 1 ? "s" : ""}
            {total > 0 && ` \u00b7 ${atendidos} atendido${atendidos !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href={`/agenda/novo?data=${currentDate}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo agendamento
        </Link>
      </div>

      {/* Date Navigation */}
      <DatePicker currentDate={currentDate} />

      {/* Appointments List */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((ag) => (
            <div
              key={ag.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white shadow-sm p-3 transition-all hover:border-gray-300 hover:shadow-md sm:gap-4 sm:p-4"
            >
              {/* Time */}
              <Link href={`/agenda/${ag.id}`} className="w-20 shrink-0 text-center sm:w-24">
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(ag.hora_inicio)}
                </p>
                <p className="text-xs text-gray-500">
                  até {formatTime(ag.hora_fim)}
                </p>
              </Link>

              {/* Divider */}
              <div className="hidden h-12 w-px bg-gray-200 sm:block" />

              {/* Patient Info */}
              <Link href={`/agenda/${ag.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  {getInitials(ag.pacientes.nome)}
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-900 hover:text-primary-600">
                    {ag.pacientes.nome}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {ag.tipo && (
                      <span>{TIPO_LABELS[ag.tipo] ?? ag.tipo}</span>
                    )}
                    {ag.tipo && ag.observacoes && <span>&middot;</span>}
                    {ag.observacoes && (
                      <span className="truncate">{ag.observacoes}</span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Status Badge (mobile) */}
              <div className="hidden sm:block">
                <StatusBadge status={ag.status} />
              </div>

              {/* Status Select */}
              <div className="shrink-0">
                <StatusSelect agendamentoId={ag.id} currentStatus={ag.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
          <EmptyStateIllustration type="agenda" />
          <h3 className="mt-6 text-sm font-semibold text-gray-900">
            Nenhum agendamento para este dia
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Agende uma consulta para começar.
          </p>
          <Link
            href={`/agenda/novo?data=${currentDate}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo agendamento
          </Link>
        </div>
      )}
    </div>
  );
}
