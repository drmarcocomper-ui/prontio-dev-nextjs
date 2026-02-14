"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { STATUS_LABELS, TIPO_LABELS } from "./types";

export function AgendaFilters({
  currentStatus,
  currentTipo,
}: {
  currentStatus: string;
  currentTipo: string;
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
    <div className="flex items-center gap-3">
      <select
        value={currentStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        aria-label="Filtrar por status"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todos os status</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={currentTipo}
        onChange={(e) => updateParam("tipo", e.target.value)}
        aria-label="Filtrar por tipo"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todos os tipos</option>
        {Object.entries(TIPO_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {isPending && (
        <div role="status" aria-label="Carregando" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      )}
    </div>
  );
}
