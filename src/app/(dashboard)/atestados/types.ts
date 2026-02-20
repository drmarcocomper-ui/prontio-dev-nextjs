export interface AtestadoPaciente {
  id: string;
  nome: string;
}

export interface AtestadoListItem {
  id: string;
  data: string | null;
  tipo: string;
  conteudo: string;
}

export interface Atestado {
  id: string;
  data: string | null;
  tipo: string;
  conteudo: string;
  cid: string | null;
  dias_afastamento: number | null;
  observacoes: string | null;
  created_at: string;
  pacientes: AtestadoPaciente;
}

export interface AtestadoImpressao {
  id: string;
  data: string | null;
  tipo: string;
  conteudo: string;
  cid: string | null;
  dias_afastamento: number | null;
  observacoes: string | null;
  pacientes: {
    id: string;
    nome: string;
    cpf: string | null;
  };
}

export interface AtestadoDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string | null;
  tipo?: string | null;
  conteudo?: string | null;
  cid?: string | null;
  dias_afastamento?: number | null;
  observacoes?: string | null;
}

export interface AtestadoComPaciente {
  id: string;
  data: string | null;
  tipo: string;
  conteudo: string;
  cid: string | null;
  dias_afastamento: number | null;
  observacoes: string | null;
  pacientes: AtestadoPaciente;
}

export const CONTEUDO_MAX_LENGTH = 5000;
export const CID_MAX_LENGTH = 20;
export { OBSERVACOES_MAX_LENGTH } from "@/lib/validators";

export const TIPOS_ATESTADO = ["comparecimento", "afastamento", "aptidao", "acompanhante"] as const;

export const TIPO_LABELS: Record<string, string> = {
  comparecimento: "Comparecimento",
  afastamento: "Afastamento",
  aptidao: "Aptidão / Saúde",
  acompanhante: "Acompanhante",
};

export const TIPO_LABELS_IMPRESSAO: Record<string, string> = {
  comparecimento: "Atestado de Comparecimento",
  afastamento: "Atestado de Afastamento",
  aptidao: "Atestado de Aptidão",
  acompanhante: "Atestado de Acompanhante",
};

// --- Helpers de formatação (re-exports) ---
export { formatDate, formatDateLong, formatDateMedium, getInitials, formatCPF } from "@/lib/format";
