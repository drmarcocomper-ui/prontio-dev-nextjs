"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Papel } from "@/lib/clinica";
import { TABS, isValidTab, getDefaultTab } from "./tab-utils";

export { isValidTab, getDefaultTab };

export function Tabs({ papel }: { papel: Papel }) {
  const searchParams = useSearchParams();
  const defaultTab = getDefaultTab(papel);
  const rawTab = searchParams.get("tab") || defaultTab;
  const currentTab = isValidTab(rawTab) ? rawTab : defaultTab;

  const tabs = TABS.filter((t) => t.roles.includes(papel));

  return (
    <div className="overflow-x-auto">
      <nav
        className="flex gap-1 rounded-lg bg-gray-100 p-1"
        aria-label="Configurações"
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/configuracoes?tab=${tab.key}`}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
