export interface LaudoPaciente {
  id: string;
  nome: string;
}

export interface LaudoListItem {
  id: string;
  data: string | null;
  conteudo: string;
}

export interface Laudo {
  id: string;
  data: string | null;
  conteudo: string;
  observacoes: string | null;
  created_at: string;
  pacientes: LaudoPaciente;
}

export interface LaudoImpressao {
  id: string;
  data: string | null;
  conteudo: string;
  observacoes: string | null;
  pacientes: {
    id: string;
    nome: string;
    cpf: string | null;
  };
}

export interface LaudoDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string | null;
  conteudo?: string | null;
  observacoes?: string | null;
}

export interface LaudoComPaciente {
  id: string;
  data: string | null;
  conteudo: string;
  observacoes: string | null;
  pacientes: LaudoPaciente;
}

export const CONTEUDO_MAX_LENGTH = 5000;
export { OBSERVACOES_MAX_LENGTH } from "@/lib/validators";

// --- Helpers de formatação (re-exports) ---
export { formatDate, formatDateLong, formatDateMedium, getInitials, formatCPF } from "@/lib/format";
