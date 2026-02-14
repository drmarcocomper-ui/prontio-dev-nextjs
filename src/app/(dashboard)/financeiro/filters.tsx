"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

function getMonthValue(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

export function Filters({
  currentMonth,
  currentType,
}: {
  currentMonth: string;
  currentType: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const shortcuts = [
    { label: "Este mês", value: getMonthValue(0) },
    { label: "Mês anterior", value: getMonthValue(-1) },
  ];

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("pagina");
    startTransition(() => {
      router.replace(`/financeiro?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1.5">
        {shortcuts.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => updateParam("mes", s.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              currentMonth === s.value
                ? "bg-primary-50 text-primary-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <input
        type="month"
        value={currentMonth}
        onChange={(e) => updateParam("mes", e.target.value)}
        aria-label="Filtrar por mês"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      <select
        value={currentType}
        onChange={(e) => updateParam("tipo", e.target.value)}
        aria-label="Filtrar por tipo"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todos os tipos</option>
        <option value="receita">Receitas</option>
        <option value="despesa">Despesas</option>
      </select>

      {isPending && (
        <div role="status" aria-label="Carregando" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      )}
    </div>
  );
}
