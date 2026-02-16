import { Fragment } from "react";
import Link from "next/link";
import { type AgendaStatus, STATUS_STYLES, getInitials } from "./types";
import type { TimeSlot } from "./time-grid";

const DIAS_CURTOS: Record<number, string> = {
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
  6: "sáb",
};

function parseDay(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  return { dayOfWeek: date.getDay(), dayNumber: d };
}

export function WeeklyGrid({
  slotsByDate,
  weekDates,
  todayStr,
}: {
  slotsByDate: Record<string, TimeSlot[]>;
  weekDates: string[];
  todayStr: string;
}) {
  // Collect all unique times across all days
  const allTimes = new Set<string>();
  for (const dateStr of weekDates) {
    for (const s of slotsByDate[dateStr] ?? []) {
      if (s.type !== "continuation") allTimes.add(s.time);
    }
  }
  const timeLabels = Array.from(allTimes).sort();

  if (timeLabels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
        <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <h3 className="mt-4 text-sm font-semibold text-gray-900">Nenhum horário configurado</h3>
        <p className="mt-1 text-sm text-gray-500">Configure os horários de atendimento nas configurações.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="min-w-[700px]">
        <div
          className="grid"
          style={{
            gridTemplateColumns: "60px repeat(6, 1fr)",
          }}
        >
          {/* Header: empty corner */}
          <div className="border-b border-r border-gray-200 bg-gray-50 p-2" />

          {/* Header: day columns */}
          {weekDates.map((dateStr) => {
            const { dayOfWeek, dayNumber } = parseDay(dateStr);
            const isToday = dateStr === todayStr;
            const label = DIAS_CURTOS[dayOfWeek] ?? "";
            return (
              <div
                key={dateStr}
                className={`border-b border-gray-200 p-2 text-center ${isToday ? "bg-primary-50" : "bg-gray-50"}`}
              >
                <span className={`block text-xs font-medium uppercase ${isToday ? "text-primary-600" : "text-gray-500"}`}>
                  {label}
                </span>
                <span className={`block text-lg font-semibold ${isToday ? "text-primary-600" : "text-gray-900"}`}>
                  {dayNumber}
                </span>
              </div>
            );
          })}

          {/* Body rows */}
          {timeLabels.map((time, rowIdx) => {
            const isLastRow = rowIdx === timeLabels.length - 1;
            const borderB = isLastRow ? "" : "border-b border-gray-100";

            return (
              <Fragment key={time}>
                {/* Time label */}
                <div className={`flex items-center justify-center border-r border-gray-100 p-1 text-xs text-gray-400 ${borderB}`}>
                  {time}
                </div>

                {/* Day cells */}
                {weekDates.map((dateStr) => {
                  const slots = slotsByDate[dateStr] ?? [];
                  const slot = slots.find((s) => s.time === time);
                  const isToday = dateStr === todayStr;

                  // No slot = outside working hours for this day
                  if (!slot) {
                    return (
                      <div
                        key={`${dateStr}-${time}`}
                        className={`bg-gray-50/50 ${borderB}`}
                      />
                    );
                  }

                  if (slot.type === "break") {
                    return (
                      <div
                        key={`${dateStr}-${time}`}
                        className={`flex items-center justify-center bg-gray-50 ${borderB}`}
                      >
                        <span className="text-xs text-gray-300">&mdash;</span>
                      </div>
                    );
                  }

                  if (slot.type === "continuation") {
                    return (
                      <div
                        key={`${dateStr}-${time}`}
                        className={borderB}
                      />
                    );
                  }

                  if (slot.type === "occupied" && slot.agendamento) {
                    const ag = slot.agendamento;
                    const statusStyle = STATUS_STYLES[ag.status] ?? "bg-gray-100 text-gray-600";
                    return (
                      <div
                        key={`${dateStr}-${time}`}
                        className={`flex items-center justify-center p-0.5 ${borderB}`}
                      >
                        <Link
                          href={`/agenda/${ag.id}`}
                          title={ag.pacientes.nome}
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition-transform hover:scale-110 ${statusStyle}`}
                        >
                          {getInitials(ag.pacientes.nome)}
                        </Link>
                      </div>
                    );
                  }

                  // Available slot
                  return (
                    <Link
                      key={`${dateStr}-${time}`}
                      href={`/agenda/novo?data=${dateStr}&hora=${time}`}
                      className={`group flex items-center justify-center transition-colors hover:bg-primary-50 ${borderB} ${isToday ? "bg-primary-50/30" : ""}`}
                    >
                      <svg
                        className="h-3.5 w-3.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-primary-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </Link>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
