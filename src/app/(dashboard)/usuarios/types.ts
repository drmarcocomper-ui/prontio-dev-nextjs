import type { Papel } from "@/lib/clinica";

export interface UsuarioListItem {
  vinculo_id: string;
  user_id: string;
  email: string;
  papel: Papel;
  clinica_id: string;
  clinica_nome: string;
  created_at: string;
}

export const PAPEL_BADGE: Record<string, { label: string; className: string }> = {
  superadmin: { label: "Superadmin", className: "bg-purple-50 text-purple-700" },
  gestor: { label: "Gestor", className: "bg-indigo-50 text-indigo-700" },
  profissional_saude: { label: "Prof. Saúde", className: "bg-primary-50 text-primary-700" },
  financeiro: { label: "Financeiro", className: "bg-green-50 text-green-700" },
  secretaria: { label: "Secretária", className: "bg-amber-50 text-amber-700" },
};

export const PAPEL_OPTIONS: { value: string; label: string }[] = [
  { value: "secretaria", label: "Secretária" },
  { value: "profissional_saude", label: "Profissional de Saúde" },
  { value: "financeiro", label: "Financeiro" },
  { value: "gestor", label: "Gestor" },
];

export const PAPEIS_VALIDOS = ["gestor", "profissional_saude", "financeiro", "secretaria"] as const;

export const EMAIL_MAX = 254;
export const SENHA_MIN = 6;
export const SENHA_MAX = 128;

export interface UsuarioDefaults {
  vinculo_id: string;
  user_id: string;
  email: string;
  papel: string;
  clinica_id: string;
  clinica_nome: string;
}

export type UsuarioFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};
