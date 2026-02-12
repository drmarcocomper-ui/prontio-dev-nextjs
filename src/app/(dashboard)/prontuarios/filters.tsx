"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function ProntuarioFilters({
  currentTipo,
  currentDe,
  currentAte,
}: {
  currentTipo: string;
  currentDe: string;
  currentAte: string;
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
    params.delete("pagina");
    startTransition(() => {
      router.replace(`/prontuarios?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentTipo}
        onChange={(e) => updateParam("tipo", e.target.value)}
        aria-label="Filtrar por tipo"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        <option value="">Todos os tipos</option>
        <option value="consulta">Consulta</option>
        <option value="retorno">Retorno</option>
        <option value="exame">Exame</option>
        <option value="procedimento">Procedimento</option>
        <option value="avaliacao">Avaliação</option>
      </select>

      <input
        type="date"
        value={currentDe}
        onChange={(e) => updateParam("de", e.target.value)}
        aria-label="Data início"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />

      <input
        type="date"
        value={currentAte}
        onChange={(e) => updateParam("ate", e.target.value)}
        aria-label="Data fim"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />

      {isPending && (
        <div role="status" aria-label="Carregando" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600" />
      )}
    </div>
  );
}
