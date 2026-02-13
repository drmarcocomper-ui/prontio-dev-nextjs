"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function MonthFilter({ currentMonth }: { currentMonth: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("mes", value);
    } else {
      params.delete("mes");
    }
    startTransition(() => {
      router.replace(`/relatorios/financeiro?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="month"
        value={currentMonth}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Filtrar por mês"
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      {isPending && (
        <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      )}
    </div>
  );
}
