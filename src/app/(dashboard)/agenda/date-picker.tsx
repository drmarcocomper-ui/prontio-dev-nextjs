"use client";

import { useRouter, useSearchParams } from "next/navigation";

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function DatePicker({ currentDate }: { currentDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(date: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("data", date);
    router.push(`/agenda?${params.toString()}`);
  }

  const today = new Date().toISOString().split("T")[0];
  const isToday = currentDate === today;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-sm">
        <button
          onClick={() => navigate(addDays(currentDate, -1))}
          className="px-3 py-2 text-gray-600 transition-colors hover:bg-gray-50"
          title="Dia anterior"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={() => navigate(today)}
          disabled={isToday}
          className="border-x border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:text-gray-400"
        >
          Hoje
        </button>
        <button
          onClick={() => navigate(addDays(currentDate, 1))}
          className="px-3 py-2 text-gray-600 transition-colors hover:bg-gray-50"
          title="Próximo dia"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <input
        type="date"
        value={currentDate}
        onChange={(e) => e.target.value && navigate(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />

      <h2 className="text-sm font-medium capitalize text-gray-700">
        {formatDateBR(currentDate)}
      </h2>
    </div>
  );
}
