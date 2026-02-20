"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function PapelFilter({ currentPapel, basePath = "/configuracoes" }: { currentPapel: string; basePath?: string }) {
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
      router.replace(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={currentPapel}
        onChange={(e) => updateParam("papel", e.target.value)}
        aria-label="Filtrar por papel"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todos os papéis</option>
        <option value="superadmin">Superadmin</option>
        <option value="gestor">Gestor</option>
        <option value="profissional_saude">Médico</option>
        <option value="financeiro">Financeiro</option>
        <option value="secretaria">Secretária</option>
      </select>

      {isPending && (
        <div role="status" aria-label="Carregando" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      )}
    </div>
  );
}
