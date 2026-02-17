"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { todayLocal } from "@/lib/date";
import { formatDateLong } from "./types";

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

function getWeekMonday(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  const dow = date.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(dateStr, diff);
}

function formatWeekRange(monday: string, saturday: string): string {
  const [, , sd] = monday.split("-").map(Number);
  const [, , ed] = saturday.split("-").map(Number);
  const mDate = new Date(Number(monday.slice(0, 4)), Number(monday.slice(5, 7)) - 1, sd, 12);
  const sDate = new Date(Number(saturday.slice(0, 4)), Number(saturday.slice(5, 7)) - 1, ed, 12);
  const mMonth = mDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const sMonth = sDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const year = sDate.getFullYear();
  if (mMonth === sMonth) {
    return `${sd}\u2013${ed} de ${mMonth} ${year}`;
  }
  return `${sd} de ${mMonth} \u2013 ${ed} de ${sMonth} ${year}`;
}

export function DatePicker({
  currentDate,
  view = "dia",
}: {
  currentDate: string;
  view?: "dia" | "semana";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(date: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("data", date);
    router.push(`/agenda?${params.toString()}`);
  }

  const today = todayLocal();
  const isWeekly = view === "semana";
  const step = isWeekly ? 7 : 1;

  // Weekly helpers
  const monday = isWeekly ? getWeekMonday(currentDate) : "";
  const saturday = isWeekly ? addDays(monday, 5) : "";
  const todayMonday = isWeekly ? getWeekMonday(today) : "";
  const isCurrentPeriod = isWeekly ? monday === todayMonday : currentDate === today;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-sm"
        role="group"
        aria-label="Navegação de data"
      >
        <button
          onClick={() => navigate(addDays(currentDate, -step))}
          className="rounded-l-lg px-3 py-2 text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
          aria-label={isWeekly ? "Semana anterior" : "Dia anterior"}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={() => navigate(today)}
          disabled={isCurrentPeriod}
          className={`border-x border-gray-200 px-4 py-2 text-sm font-medium transition-all ${
            isCurrentPeriod
              ? "bg-primary-50 text-primary-600"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          {isWeekly ? "Esta semana" : "Hoje"}
        </button>
        <button
          onClick={() => navigate(addDays(currentDate, step))}
          className="rounded-r-lg px-3 py-2 text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
          aria-label={isWeekly ? "Próxima semana" : "Próximo dia"}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {!isWeekly && (
        <input
          type="date"
          value={currentDate}
          onChange={(e) => e.target.value && navigate(e.target.value)}
          aria-label="Selecionar data"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      )}

      <h2 className="text-sm font-medium capitalize text-gray-700">
        {isWeekly ? formatWeekRange(monday, saturday) : formatDateLong(currentDate)}
      </h2>
    </div>
  );
}
