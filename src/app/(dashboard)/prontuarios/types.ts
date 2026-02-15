export type ProntuarioTipo = "consulta" | "retorno" | "exame" | "procedimento" | "avaliacao";

export interface ProntuarioPaciente {
  id: string;
  nome: string;
}

export interface Prontuario {
  id: string;
  data: string;
  tipo: ProntuarioTipo | null;
  cid: string | null;
  queixa_principal: string | null;
  historia_doenca: string | null;
  exame_fisico: string | null;
  hipotese_diagnostica: string | null;
  conduta: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string | null;
  pacientes: ProntuarioPaciente;
}

export interface ProntuarioListItem {
  id: string;
  data: string;
  tipo: ProntuarioTipo | null;
  queixa_principal: string | null;
  pacientes: ProntuarioPaciente;
}

export interface ProntuarioDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string;
  tipo?: ProntuarioTipo | null;
  queixa_principal?: string | null;
}

export const TEXTO_MAX_LENGTH = 5000;

export const TIPO_LABELS: Record<ProntuarioTipo, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  avaliacao: "Avaliação",
};

// --- Helpers de formatação (re-exports) ---
export { formatDate, formatDateLong, getInitials } from "@/lib/format";
