import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DatePicker } from "./date-picker";
import { ViewToggle } from "./view-toggle";
import { todayLocal, parseLocalDate } from "@/lib/date";
import { DATE_RE } from "@/lib/validators";
import { type Agendamento, type AgendaTipo, STATUS_LABELS, TIPO_LABELS } from "./types";
import { AgendaFilters } from "./filters";
import { QueryError } from "@/components/query-error";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";
import { getHorarioConfig, DIAS_SEMANA, getWeekRange } from "./utils";
import { TimeGrid, generateTimeSlots, type TimeSlot } from "./time-grid";
import { WeeklyGrid } from "./weekly-grid";

const VALID_STATUS = new Set<string>(Object.keys(STATUS_LABELS));
const VALID_TIPO = new Set<string>(Object.keys(TIPO_LABELS));

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; status?: string; tipo?: string; view?: string }>;
}) {
  const { data: dataParam, status: statusParam, tipo: tipoParam, view: viewParam } = await searchParams;
  const currentDate = dataParam && DATE_RE.test(dataParam) ? dataParam : todayLocal();
  const currentStatus = statusParam && VALID_STATUS.has(statusParam) ? statusParam : "";
  const currentTipo = tipoParam && VALID_TIPO.has(tipoParam) ? tipoParam : "";
  const view = viewParam === "semana" ? ("semana" as const) : ("dia" as const);

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) redirect("/login");

  let medicoUserId: string | undefined;
  try {
    medicoUserId = await getMedicoId();
  } catch {
    // Clínica sem médico cadastrado — usa config geral
  }
  const config = await getHorarioConfig(supabase, ctx.clinicaId, medicoUserId);
  const duracao = config.duracao_consulta ? parseInt(config.duracao_consulta, 10) : 15;

  // Build query — range for week, single date for day
  let query = supabase
    .from("agendamentos")
    .select("id, paciente_id, data, hora_inicio, hora_fim, tipo, status, observacoes, pacientes(id, nome, telefone)")
    .eq("clinica_id", ctx.clinicaId);

  let weekDates: string[] | null = null;

  if (view === "semana") {
    const week = getWeekRange(currentDate);
    weekDates = week.weekDates;
    query = query.gte("data", week.weekStart).lte("data", week.weekEnd);
  } else {
    query = query.eq("data", currentDate);
  }

  if (currentTipo) {
    query = query.eq("tipo", currentTipo as AgendaTipo);
  }

  const maxResults = view === "semana" ? 2000 : 500;
  const { data: agendamentos, error } = await query.order("data").order("hora_inicio").limit(maxResults);

  if (error) {
    return <QueryError title="Agenda" />;
  }

  const allItems = (agendamentos ?? []) as unknown as Agendamento[];
  const total = allItems.length;

  const statusCounts: Record<string, number> = {};
  for (const a of allItems) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }
  const atendidos = statusCounts["atendido"] ?? 0;

  // ── Weekly view ──────────────────────────────────────────────
  if (view === "semana" && weekDates) {
    const grouped: Record<string, Agendamento[]> = {};
    for (const d of weekDates) grouped[d] = [];
    for (const ag of allItems) {
      if (grouped[ag.data]) grouped[ag.data].push(ag);
    }

    const slotsByDate: Record<string, TimeSlot[]> = {};
    for (const dateStr of weekDates) {
      const d = parseLocalDate(dateStr);
      const dow = d.getDay();
      const dia = DIAS_SEMANA[dow];
      const dayOff = !dia || !config[`horario_${dia.key}_inicio`];
      slotsByDate[dateStr] = dia && !dayOff
        ? generateTimeSlots(config, dia.key, grouped[dateStr], duracao)
        : [];
    }

    return (
      <div className="animate-fade-in space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
            <p className="mt-1 text-sm text-gray-500">
              {total} agendamento{total !== 1 ? "s" : ""} na semana
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

        <div className="flex flex-wrap items-center gap-3">
          <DatePicker currentDate={currentDate} view="semana" />
          <ViewToggle currentView="semana" />
        </div>

        <WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr={todayLocal()} />
      </div>
    );
  }

  // ── Daily view ───────────────────────────────────────────────
  const items = currentStatus
    ? allItems.filter((a) => a.status === currentStatus)
    : allItems;

  const date = parseLocalDate(currentDate);
  const dayOfWeek = date.getDay();
  const dia = DIAS_SEMANA[dayOfWeek];
  const isDayOff = !dia || !config[`horario_${dia.key}_inicio`];

  const slots = dia && !isDayOff
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

      {/* Date Navigation + View Toggle + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker currentDate={currentDate} view="dia" />
        <ViewToggle currentView="dia" />
        <AgendaFilters currentStatus={currentStatus} currentTipo={currentTipo} statusCounts={statusCounts} total={total} />
      </div>

      {/* Time Grid */}
      <TimeGrid slots={slots} currentDate={currentDate} isDayOff={isDayOff} />
    </div>
  );
}
