"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "consultorio", label: "Consultório" },
  { key: "profissional", label: "Profissional" },
  { key: "horarios", label: "Horários" },
  { key: "conta", label: "Conta" },
  { key: "aparencia", label: "Aparência" },
  { key: "dados", label: "Dados" },
];

export function Tabs() {
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") || "consultorio";

  return (
    <div className="overflow-x-auto">
      <nav
        className="flex gap-1 rounded-lg bg-gray-100 p-1"
        aria-label="Tabs"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/configuracoes?tab=${tab.key}`}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
              current === tab.key
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
