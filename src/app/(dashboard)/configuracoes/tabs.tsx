"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Papel } from "@/lib/clinica";

const ALL_TABS = [
  { key: "consultorio", label: "Consultório", roles: ["medico"] as Papel[] },
  { key: "profissional", label: "Profissional", roles: ["medico"] as Papel[] },
  { key: "horarios", label: "Horários", roles: ["medico"] as Papel[] },
  { key: "conta", label: "Conta", roles: ["medico", "secretaria"] as Papel[] },
  { key: "aparencia", label: "Aparência", roles: ["medico"] as Papel[] },
  { key: "clinicas", label: "Clínicas", roles: ["medico"] as Papel[] },
  { key: "dados", label: "Dados", roles: ["medico"] as Papel[] },
];

export function Tabs({ papel }: { papel: Papel }) {
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") || "consultorio";

  const tabs = ALL_TABS.filter((t) => t.roles.includes(papel));

  return (
    <div className="overflow-x-auto">
      <nav
        className="flex gap-1 rounded-lg bg-gray-100 p-1"
        aria-label="Tabs"
      >
        {tabs.map((tab) => (
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
