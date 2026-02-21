"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ACAO_LABELS, RECURSO_LABELS } from "./types";

interface AuditFiltersProps {
  currentAcao: string;
  currentRecurso: string;
  currentDataInicio: string;
  currentDataFim: string;
}

export function AuditFilters({ currentAcao, currentRecurso, currentDataInicio, currentDataFim }: AuditFiltersProps) {
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
    params.delete("pagina");
    startTransition(() => {
      router.replace(`/auditoria?${params.toString()}`);
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.replace("/auditoria");
    });
  }

  const hasFilters = currentAcao || currentRecurso || currentDataInicio || currentDataFim;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentAcao}
        onChange={(e) => updateParam("acao", e.target.value)}
        aria-label="Filtrar por ação"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todas as ações</option>
        {Object.entries(ACAO_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select
        value={currentRecurso}
        onChange={(e) => updateParam("recurso", e.target.value)}
        aria-label="Filtrar por recurso"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todos os recursos</option>
        {Object.entries(RECURSO_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <input
        type="date"
        value={currentDataInicio}
        onChange={(e) => updateParam("data_inicio", e.target.value)}
        aria-label="Data início"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      <input
        type="date"
        value={currentDataFim}
        onChange={(e) => updateParam("data_fim", e.target.value)}
        aria-label="Data fim"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          Limpar filtros
        </button>
      )}

      {isPending && (
        <div role="status" aria-label="Carregando" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      )}
    </div>
  );
}
