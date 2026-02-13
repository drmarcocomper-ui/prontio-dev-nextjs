"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "identificacao", label: "Identificação" },
  { key: "prontuario", label: "Prontuário" },
];

export function Tabs({ pacienteId }: { pacienteId: string }) {
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") || "identificacao";

  return (
    <div className="overflow-x-auto border-b border-gray-200">
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/pacientes/${pacienteId}?tab=${tab.key}`}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              current === tab.key
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
