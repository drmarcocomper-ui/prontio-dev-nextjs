import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DatePicker } from "./date-picker";
import { todayLocal, parseLocalDate } from "@/lib/date";
import { DATE_RE } from "@/lib/validators";
import { type Agendamento, type AgendaStatus, type AgendaTipo, STATUS_LABELS, TIPO_LABELS } from "./types";
import { AgendaFilters } from "./filters";
import { getClinicaAtual } from "@/lib/clinica";
import { getHorarioConfig, DIAS_SEMANA } from "./utils";
import { TimeGrid, generateTimeSlots } from "./time-grid";

const VALID_STATUS = new Set<string>(Object.keys(STATUS_LABELS));
const VALID_TIPO = new Set<string>(Object.keys(TIPO_LABELS));

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; status?: string; tipo?: string }>;
}) {
  const { data: dataParam, status: statusParam, tipo: tipoParam } = await searchParams;
  const currentDate = dataParam && DATE_RE.test(dataParam) ? dataParam : todayLocal();
  const currentStatus = statusParam && VALID_STATUS.has(statusParam) ? statusParam : "";
  const currentTipo = tipoParam && VALID_TIPO.has(tipoParam) ? tipoParam : "";

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) redirect("/login");

  let query = supabase
    .from("agendamentos")
    .select("id, paciente_id, data, hora_inicio, hora_fim, tipo, status, observacoes, pacientes(id, nome, telefone)")
    .eq("data", currentDate)
    .eq("clinica_id", ctx.clinicaId);

  if (currentStatus) {
    query = query.eq("status", currentStatus as AgendaStatus);
  }
  if (currentTipo) {
    query = query.eq("tipo", currentTipo as AgendaTipo);
  }

  const { data: agendamentos, error } = await query.order("hora_inicio");

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

  // Build time grid
  const date = parseLocalDate(currentDate);
  const dayOfWeek = date.getDay();
  const isSunday = dayOfWeek === 0;
  const dia = DIAS_SEMANA[dayOfWeek];

  const config = await getHorarioConfig(supabase, ctx.clinicaId);
  const duracao = config.duracao_consulta ? parseInt(config.duracao_consulta, 10) : 15;

  const slots = dia
    ? generateTimeSlots(config, dia.key, items, duracao)
    : [];

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

      {/* Date Navigation + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker currentDate={currentDate} />
        <AgendaFilters currentStatus={currentStatus} currentTipo={currentTipo} />
      </div>

      {/* Time Grid */}
      <TimeGrid slots={slots} currentDate={currentDate} isSunday={isSunday} />
    </div>
  );
}
