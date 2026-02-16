"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Papel } from "@/lib/clinica";

interface Tab {
  key: string;
  label: string;
}

interface Category {
  key: string;
  label: string;
  roles: Papel[];
  tabs: Tab[];
}

const CATEGORIES: Category[] = [
  {
    key: "clinica",
    label: "Clínica",
    roles: ["superadmin", "gestor"],
    tabs: [
      { key: "consultorio", label: "Consultório" },
      { key: "horarios", label: "Horários" },
      { key: "valores", label: "Valores" },
      { key: "clinicas", label: "Clínicas" },
    ],
  },
  {
    key: "profissional",
    label: "Profissional",
    roles: ["superadmin", "gestor"],
    tabs: [
      { key: "profissional", label: "Profissional" },
    ],
  },
  {
    key: "usuario",
    label: "Usuário",
    roles: ["superadmin", "gestor", "profissional_saude", "financeiro", "secretaria"],
    tabs: [
      { key: "conta", label: "Conta" },
      { key: "aparencia", label: "Aparência" },
      { key: "dados", label: "Dados" },
    ],
  },
];

const ALL_TAB_KEYS = CATEGORIES.flatMap((c) => c.tabs.map((t) => t.key));

export function isValidTab(tab: string): boolean {
  return ALL_TAB_KEYS.includes(tab);
}

export function getDefaultTab(papel: Papel): string {
  const categories = CATEGORIES.filter((c) => c.roles.includes(papel));
  return categories[0]?.tabs[0]?.key ?? "conta";
}

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
