"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Financeiro", href: "/relatorios/financeiro" },
  { label: "Produtividade", href: "/relatorios/produtividade" },
];

export function ReportNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-lg bg-gray-100 p-1" aria-label="Tipo de relatório">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
