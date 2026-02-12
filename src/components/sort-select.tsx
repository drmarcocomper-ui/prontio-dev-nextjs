"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface SortOption {
  label: string;
  column: string;
  direction: "asc" | "desc";
}

interface SortSelectProps {
  options: SortOption[];
  currentColumn: string;
  currentDirection: "asc" | "desc";
  basePath: string;
}

export function SortSelect({
  options,
  currentColumn,
  currentDirection,
  basePath,
}: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentValue = `${currentColumn}:${currentDirection}`;

  function handleChange(value: string) {
    const [column, direction] = value.split(":");
    const params = new URLSearchParams(searchParams.toString());
    params.set("ordem", column);
    params.set("dir", direction);
    params.delete("pagina");
    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500">Ordenar por:</label>
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        {options.map((opt) => (
          <option key={`${opt.column}:${opt.direction}`} value={`${opt.column}:${opt.direction}`}>
            {opt.label}
          </option>
        ))}
      </select>
      {isPending && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600" />
      )}
    </div>
  );
}
