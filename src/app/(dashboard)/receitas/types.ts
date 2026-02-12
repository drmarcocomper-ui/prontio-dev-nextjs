export interface ReceitaPaciente {
  id: string;
  nome: string;
}

export interface ReceitaListItem {
  id: string;
  data: string;
  tipo: string;
  medicamentos: string;
  pacientes: ReceitaPaciente;
}

export interface Receita {
  id: string;
  data: string;
  tipo: string;
  medicamentos: string;
  observacoes: string | null;
  created_at: string;
  pacientes: ReceitaPaciente;
}

export interface ReceitaImpressao {
  id: string;
  data: string;
  tipo: string;
  medicamentos: string;
  observacoes: string | null;
  pacientes: {
    nome: string;
    cpf: string | null;
  };
}

export interface ReceitaDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string;
  tipo?: string | null;
  medicamentos?: string | null;
  observacoes?: string | null;
}

export interface ReceitaComPaciente {
  id: string;
  data: string;
  tipo: string;
  medicamentos: string;
  observacoes: string | null;
  pacientes: ReceitaPaciente;
}

export const MEDICAMENTOS_MAX_LENGTH = 5000;
export const OBSERVACOES_MAX_LENGTH = 1000;

export const TIPO_LABELS: Record<string, string> = {
  simples: "Simples",
  especial: "Especial",
  controle_especial: "Controle Especial",
};

export const TIPO_LABELS_IMPRESSAO: Record<string, string> = {
  simples: "Receita Simples",
  especial: "Receita Especial",
  controle_especial: "Receita de Controle Especial",
};

// --- Helpers de formatação (re-exports) ---
export { formatDate, formatDateLong, formatDateMedium, getInitials, formatCPF } from "@/lib/format";
