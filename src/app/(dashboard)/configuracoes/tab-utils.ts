import type { Papel } from "@/lib/clinica";

export interface Tab {
  key: string;
  label: string;
  roles: Papel[];
}

export const TABS: Tab[] = [
  { key: "consultorio", label: "Consultório", roles: ["superadmin", "gestor"] },
  { key: "agenda", label: "Agenda", roles: ["superadmin", "gestor"] },
  { key: "conta", label: "Conta", roles: ["superadmin", "gestor", "profissional_saude", "financeiro", "secretaria"] },
  { key: "clinicas", label: "Clínicas", roles: ["superadmin", "gestor"] },
];

const ALL_TAB_KEYS = TABS.map((t) => t.key);

export function isValidTab(tab: string): boolean {
  return ALL_TAB_KEYS.includes(tab);
}

export function getDefaultTab(papel: Papel): string {
  const tabs = TABS.filter((t) => t.roles.includes(papel));
  return tabs[0]?.key ?? "conta";
}
