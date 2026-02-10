"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

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

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`/financeiro?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="month"
        value={currentMonth}
        onChange={(e) => updateParam("mes", e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />

      <select
        value={currentType}
        onChange={(e) => updateParam("tipo", e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        <option value="">Todos os tipos</option>
        <option value="receita">Receitas</option>
        <option value="despesa">Despesas</option>
      </select>

      {isPending && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600" />
      )}
    </div>
  );
}
