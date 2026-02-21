import type { Papel } from "@/lib/clinica";

export interface Tab {
  key: string;
  label: string;
  roles: Papel[];
}

export const TABS: Tab[] = [
  { key: "clinica", label: "Clínica", roles: ["superadmin", "gestor"] },
  { key: "minha-conta", label: "Minha Conta", roles: ["superadmin", "gestor", "profissional_saude", "financeiro", "secretaria"] },
  { key: "medicamentos", label: "Medicamentos", roles: ["superadmin"] },
  { key: "exames", label: "Exames", roles: ["superadmin"] },
  { key: "profissionais", label: "Encaminhamentos", roles: ["superadmin"] },
  { key: "profissionais-clinica", label: "Profissionais", roles: ["superadmin", "gestor"] },
  { key: "gestao", label: "Gestão", roles: ["superadmin", "gestor"] },
  { key: "usuarios", label: "Usuários", roles: ["superadmin", "gestor"] },
];

const ALL_TAB_KEYS = TABS.map((t) => t.key);

export function isValidTab(tab: string): boolean {
  return ALL_TAB_KEYS.includes(tab);
}

export function getDefaultTab(papel: Papel): string {
  const tabs = TABS.filter((t) => t.roles.includes(papel));
  return tabs[0]?.key ?? "minha-conta";
}
