"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { todayLocal } from "@/lib/date";
import { formatDateBR } from "./types";

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

export function DatePicker({ currentDate }: { currentDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(date: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("data", date);
    router.push(`/agenda?${params.toString()}`);
  }

  const today = todayLocal();
  const isToday = currentDate === today;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-sm"
        role="group"
        aria-label="Navegação de data"
      >
        <button
          onClick={() => navigate(addDays(currentDate, -1))}
          className="rounded-l-lg px-3 py-2 text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
          aria-label="Dia anterior"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={() => navigate(today)}
          disabled={isToday}
          className={`border-x border-gray-200 px-4 py-2 text-sm font-medium transition-all ${
            isToday
              ? "bg-primary-50 text-primary-600"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Hoje
        </button>
        <button
          onClick={() => navigate(addDays(currentDate, 1))}
          className="rounded-r-lg px-3 py-2 text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
          aria-label="Próximo dia"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <input
        type="date"
        value={currentDate}
        onChange={(e) => e.target.value && navigate(e.target.value)}
        aria-label="Selecionar data"
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      <h2 className="text-sm font-medium capitalize text-gray-700">
        {formatDateBR(currentDate)}
      </h2>
    </div>
  );
}
