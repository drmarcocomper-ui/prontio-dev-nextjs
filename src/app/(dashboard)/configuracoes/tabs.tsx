"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Papel } from "@/lib/clinica";
import { CATEGORIES, isValidTab, getDefaultTab, type Category } from "./tab-utils";

export { isValidTab, getDefaultTab };

function findCategoryByTab(tab: string, categories: Category[]): Category | undefined {
  return categories.find((cat) => cat.tabs.some((t) => t.key === tab));
}

export function Tabs({ papel }: { papel: Papel }) {
  const searchParams = useSearchParams();
  const defaultTab = getDefaultTab(papel);
  const rawTab = searchParams.get("tab") || defaultTab;
  const currentTab = isValidTab(rawTab) ? rawTab : defaultTab;

  const categories = CATEGORIES.filter((c) => c.roles.includes(papel));
  const activeCategory = findCategoryByTab(currentTab, categories) ?? categories[0];

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <nav
          className="flex gap-1 rounded-lg bg-gray-100 p-1"
          aria-label="Categorias"
        >
          {categories.map((cat) => {
            const isActive = activeCategory?.key === cat.key;
            const firstTab = cat.tabs[0].key;
            return (
              <Link
                key={cat.key}
                href={`/configuracoes?tab=${firstTab}`}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {activeCategory && activeCategory.tabs.length > 1 && (
        <div className="overflow-x-auto">
        <nav
          className="flex gap-4 border-b border-gray-200 px-1"
          aria-label="Sub-abas"
        >
          {activeCategory.tabs.map((tab) => {
            const isActive = currentTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/configuracoes?tab=${tab.key}`}
                className={`border-b-2 px-1 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        </div>
      )}
    </div>
  );
}
