"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { STATUS_LABELS, TIPO_LABELS, type AgendaStatus } from "./types";

const PILL_COLORS: Record<AgendaStatus, { active: string; inactive: string }> = {
  agendado: {
    active: "bg-blue-100 text-blue-700 ring-1 ring-blue-300",
    inactive: "text-blue-600 hover:bg-blue-50",
  },
  confirmado: {
    active: "bg-blue-100 text-blue-700 ring-1 ring-blue-300",
    inactive: "text-blue-600 hover:bg-blue-50",
  },
  em_atendimento: {
    active: "bg-amber-100 text-amber-700 ring-1 ring-amber-300",
    inactive: "text-amber-600 hover:bg-amber-50",
  },
  atendido: {
    active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
    inactive: "text-emerald-600 hover:bg-emerald-50",
  },
  cancelado: {
    active: "bg-red-100 text-red-700 ring-1 ring-red-300",
    inactive: "text-red-600 hover:bg-red-50",
  },
  faltou: {
    active: "bg-gray-200 text-gray-700 ring-1 ring-gray-300",
    inactive: "text-gray-500 hover:bg-gray-50",
  },
};

const STATUS_ORDER: AgendaStatus[] = [
  "agendado",
  "confirmado",
  "em_atendimento",
  "atendido",
  "cancelado",
  "faltou",
];

export function AgendaFilters({
  currentStatus,
  currentTipo,
  statusCounts,
  total,
}: {
  currentStatus: string;
  currentTipo: string;
  statusCounts: Record<string, number>;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`/agenda?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Status pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => updateParam("status", "")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            currentStatus === ""
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Todos{total > 0 ? ` (${total})` : ""}
        </button>

        {STATUS_ORDER.map((status) => {
          const count = statusCounts[status] ?? 0;
          if (count === 0) return null;
          const isActive = currentStatus === status;
          const colors = PILL_COLORS[status];

          return (
            <button
              key={status}
              onClick={() => updateParam("status", isActive ? "" : status)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? colors.active : colors.inactive
              }`}
            >
              {STATUS_LABELS[status]} ({count})
            </button>
          );
        })}

        {isPending && (
          <div role="status" aria-label="Carregando" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
        )}
      </div>

      {/* Tipo filter */}
      <select
        value={currentTipo}
        onChange={(e) => updateParam("tipo", e.target.value)}
        aria-label="Filtrar por tipo"
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todos os tipos</option>
        {Object.entries(TIPO_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
