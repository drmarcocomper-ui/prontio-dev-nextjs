import Link from "next/link";
import { StatusSelect } from "./status-select";
import {
  type Agendamento,
  type AgendaStatus,
  TIPO_LABELS,
  formatTime,
  getInitials,
} from "./types";
import { timeToMinutes } from "./utils";

export interface TimeSlot {
  time: string;
  timeEnd: string;
  type: "available" | "occupied" | "break" | "continuation";
  agendamento?: Agendamento;
  spanSlots?: number;
}

const STATUS_BORDER: Record<AgendaStatus, string> = {
  agendado: "border-l-blue-400",
  confirmado: "border-l-blue-400",
  em_atendimento: "border-l-amber-400",
  atendido: "border-l-emerald-400",
  cancelado: "border-l-red-400",
  faltou: "border-l-gray-400",
};

export function generateTimeSlots(
  config: Record<string, string>,
  dayKey: string,
  agendamentos: Agendamento[],
  duracao: number,
): TimeSlot[] {
  const inicio = config[`horario_${dayKey}_inicio`] || "08:00";
  const fim = config[`horario_${dayKey}_fim`] || "18:00";
  const intervaloInicio = config["intervalo_inicio"] || "";
  const intervaloFim = config["intervalo_fim"] || "";

  const startMin = timeToMinutes(inicio);
  const endMin = timeToMinutes(fim);
  const breakStartMin = intervaloInicio ? timeToMinutes(intervaloInicio) : -1;
  const breakEndMin = intervaloFim ? timeToMinutes(intervaloFim) : -1;

  const slots: TimeSlot[] = [];
  const seenIds = new Set<string>();

  for (let min = startMin; min < endMin; min += duracao) {
    const h = Math.floor(min / 60).toString().padStart(2, "0");
    const m = (min % 60).toString().padStart(2, "0");
    const time = `${h}:${m}`;

    const endSlotMin = min + duracao;
    const eh = Math.floor(endSlotMin / 60).toString().padStart(2, "0");
    const em = (endSlotMin % 60).toString().padStart(2, "0");
    const timeEnd = `${eh}:${em}`;

    // Find overlapping appointment
    const ag = agendamentos.find((a) => {
      const agStart = timeToMinutes(a.hora_inicio);
      const agEnd = timeToMinutes(a.hora_fim);
      return agStart < endSlotMin && agEnd > min;
    });

    if (ag) {
      if (seenIds.has(ag.id)) {
        slots.push({ time, timeEnd, type: "continuation", agendamento: ag });
      } else {
        seenIds.add(ag.id);
        // Calculate how many slots this appointment spans
        const agStart = timeToMinutes(ag.hora_inicio);
        const agEnd = timeToMinutes(ag.hora_fim);
        const spanSlots = Math.ceil((agEnd - agStart) / duracao);
        slots.push({ time, timeEnd, type: "occupied", agendamento: ag, spanSlots });
      }
    } else if (
      breakStartMin >= 0 &&
      breakEndMin >= 0 &&
      min >= breakStartMin &&
      min < breakEndMin
    ) {
      slots.push({ time, timeEnd, type: "break" });
    } else {
      slots.push({ time, timeEnd, type: "available" });
    }
  }

  // Inject overlapping appointments that weren't placed in the regular grid
  const unplaced = agendamentos
    .filter((a) => !seenIds.has(a.id))
    .sort((a, b) => timeToMinutes(b.hora_inicio) - timeToMinutes(a.hora_inicio));

  for (const ag of unplaced) {
    const agStartMin = timeToMinutes(ag.hora_inicio);
    const agEndMin = timeToMinutes(ag.hora_fim);
    const agTimeEnd = `${Math.floor(agEndMin / 60).toString().padStart(2, "0")}:${(agEndMin % 60).toString().padStart(2, "0")}`;

    // Insert after the last slot whose time <= this appointment's start
    let insertIdx = 0;
    for (let i = slots.length - 1; i >= 0; i--) {
      if (timeToMinutes(slots[i].time) <= agStartMin) {
        insertIdx = i + 1;
        break;
      }
    }

    slots.splice(insertIdx, 0, {
      time: ag.hora_inicio.slice(0, 5),
      timeEnd: agTimeEnd,
      type: "occupied",
      agendamento: ag,
    });
  }

  return slots;
}

export function TimeGrid({
  slots,
  currentDate,
  isSunday,
}: {
  slots: TimeSlot[];
  currentDate: string;
  isSunday: boolean;
}) {
  if (isSunday) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
        <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          Sem expediente aos domingos
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Selecione outro dia para ver a agenda.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {slots.map((slot, i) => {
        const isLast = i === slots.length - 1;
        const borderBottom = isLast ? "" : "border-b border-gray-100";

        if (slot.type === "continuation") {
          return (
            <div
              key={`${slot.time}-cont`}
              className={`flex items-center ${borderBottom}`}
            >
              <div className="w-16 shrink-0 py-2 text-center sm:w-20">
                <span className="text-xs text-gray-300">{slot.time}</span>
              </div>
              <div className="flex-1 py-2" />
            </div>
          );
        }

        if (slot.type === "break") {
          return (
            <div
              key={`${slot.time}-break`}
              className={`flex items-center bg-gray-50 ${borderBottom}`}
            >
              <div className="w-16 shrink-0 py-3 text-center sm:w-20">
                <span className="text-xs font-medium text-gray-400">{slot.time}</span>
              </div>
              <div className="flex flex-1 items-center gap-2 py-3 pr-4">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-sm italic text-gray-400">Intervalo</span>
              </div>
            </div>
          );
        }

        if (slot.type === "occupied" && slot.agendamento) {
          const ag = slot.agendamento;
          const borderColor = STATUS_BORDER[ag.status] ?? "border-l-gray-400";

          return (
            <div
              key={`${slot.time}-occ-${ag.id}`}
              className={`flex items-center border-l-4 ${borderColor} ${borderBottom}`}
            >
              <div className="w-16 shrink-0 py-3 text-center sm:w-20">
                <p className="text-sm font-semibold text-gray-900">
                  {formatTime(ag.hora_inicio)}
                </p>
              </div>

              <Link
                href={`/agenda/${ag.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-2 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
                  {getInitials(ag.pacientes.nome)}
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-900">
                    {ag.pacientes.nome}
                  </span>
                  <span className="block truncate text-xs text-gray-500">
                    {ag.tipo ? (TIPO_LABELS[ag.tipo] ?? ag.tipo) : ""}
                    {ag.tipo && ag.observacoes ? " \u00b7 " : ""}
                    {ag.observacoes ?? ""}
                  </span>
                </div>
              </Link>

              <div className="shrink-0 pr-3">
                <StatusSelect agendamentoId={ag.id} currentStatus={ag.status} />
              </div>
            </div>
          );
        }

        // Available slot
        return (
          <Link
            key={`${slot.time}-avail`}
            href={`/agenda/novo?data=${currentDate}&hora=${slot.time}`}
            className={`group flex items-center transition-colors hover:bg-primary-50 ${borderBottom}`}
          >
            <div className="w-16 shrink-0 py-3 text-center sm:w-20">
              <span className="text-sm text-gray-400 group-hover:text-primary-600">
                {slot.time}
              </span>
            </div>
            <div className="flex flex-1 items-center gap-2 py-3 pr-4">
              <svg
                className="h-4 w-4 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-sm text-transparent group-hover:text-primary-500">
                Agendar
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
