import type { Papel } from "@/lib/clinica";

interface Tab {
  key: string;
  label: string;
}

export interface Category {
  key: string;
  label: string;
  roles: Papel[];
  tabs: Tab[];
}

export const CATEGORIES: Category[] = [
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
