export interface EncaminhamentoPaciente {
  id: string;
  nome: string;
}

export interface EncaminhamentoListItem {
  id: string;
  data: string | null;
  profissional_destino: string;
  especialidade: string;
  motivo: string;
}

export interface Encaminhamento {
  id: string;
  data: string | null;
  profissional_destino: string;
  especialidade: string;
  telefone_profissional: string | null;
  motivo: string;
  observacoes: string | null;
  created_at: string;
  pacientes: EncaminhamentoPaciente;
}

export interface EncaminhamentoImpressao {
  id: string;
  data: string | null;
  profissional_destino: string;
  especialidade: string;
  telefone_profissional: string | null;
  motivo: string;
  observacoes: string | null;
  pacientes: {
    id: string;
    nome: string;
    cpf: string | null;
  };
}

export interface EncaminhamentoDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string | null;
  profissional_destino?: string | null;
  especialidade?: string | null;
  telefone_profissional?: string | null;
  motivo?: string | null;
  observacoes?: string | null;
}

export interface EncaminhamentoComPaciente {
  id: string;
  data: string | null;
  profissional_destino: string;
  especialidade: string;
  telefone_profissional: string | null;
  motivo: string;
  observacoes: string | null;
  pacientes: EncaminhamentoPaciente;
}

export const MOTIVO_MAX_LENGTH = 5000;
export const PROFISSIONAL_DESTINO_MAX_LENGTH = 200;
export const ESPECIALIDADE_MAX_LENGTH = 200;
export const TELEFONE_MAX_LENGTH = 20;
export { OBSERVACOES_MAX_LENGTH } from "@/lib/validators";

// --- Helpers de formatação (re-exports) ---
export { formatDate, formatDateLong, formatDateMedium, getInitials, formatCPF, formatPhone } from "@/lib/format";
