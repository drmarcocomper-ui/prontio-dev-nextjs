"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function getPeriodShortcuts() {
  const today = todayStr();
  return [
    { label: "Hoje", de: today, ate: today },
    { label: "7 dias", de: daysAgo(7), ate: today },
    { label: "Este mês", de: firstOfMonth(), ate: today },
  ];
}

export function ProntuarioFilters({
  currentTipo,
  currentDe,
  currentAte,
  pacienteId,
  pacienteNome,
}: {
  currentTipo: string;
  currentDe: string;
  currentAte: string;
  pacienteId: string;
  pacienteNome: string;
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

  function setPeriod(de: string, ate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("de", de);
    params.set("ate", ate);
    params.delete("pagina");
    startTransition(() => {
      router.replace(`/prontuarios?${params.toString()}`);
    });
  }

  function removerFiltroPaciente() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("paciente_id");
    params.delete("pagina");
    startTransition(() => {
      router.replace(`/prontuarios?${params.toString()}`);
    });
  }

  const shortcuts = getPeriodShortcuts();
  const isShortcutActive = (s: { de: string; ate: string }) =>
    currentDe === s.de && currentAte === s.ate;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {pacienteId && pacienteNome && (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700">
          {pacienteNome}
          <button
            type="button"
            onClick={removerFiltroPaciente}
            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-violet-200"
            aria-label={`Remover filtro por ${pacienteNome}`}
          >
            <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      )}

      <div className="flex gap-1.5">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setPeriod(s.de, s.ate)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isShortcutActive(s)
                ? "bg-primary-50 text-primary-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <select
        value={currentTipo}
        onChange={(e) => updateParam("tipo", e.target.value)}
        aria-label="Filtrar por tipo"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      <input
        type="date"
        value={currentAte}
        onChange={(e) => updateParam("ate", e.target.value)}
        aria-label="Data fim"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {isPending && (
        <div role="status" aria-label="Carregando" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      )}
    </div>
  );
}
