"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "consultorio", label: "Consultório" },
  { key: "profissional", label: "Profissional" },
  { key: "horarios", label: "Horários" },
  { key: "conta", label: "Conta" },
];

export function Tabs() {
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") || "consultorio";

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/configuracoes?tab=${tab.key}`}
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
