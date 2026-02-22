export interface InternacaoPaciente {
  id: string;
  nome: string;
}

export interface InternacaoListItem {
  id: string;
  data: string | null;
  hospital_nome: string | null;
  indicacao_clinica: string;
}

export interface Internacao {
  id: string;
  data: string | null;
  hospital_nome: string | null;
  data_sugerida_internacao: string | null;
  carater_atendimento: string | null;
  tipo_internacao: string | null;
  regime_internacao: string | null;
  diarias_solicitadas: number | null;
  previsao_opme: boolean;
  previsao_quimioterapico: boolean;
  indicacao_clinica: string;
  cid_principal: string | null;
  cid_2: string | null;
  cid_3: string | null;
  cid_4: string | null;
  indicacao_acidente: string | null;
  procedimentos: string | null;
  observacoes: string | null;
  created_at: string;
  pacientes: InternacaoPaciente;
}

export interface InternacaoImpressao {
  id: string;
  data: string | null;
  hospital_nome: string | null;
  data_sugerida_internacao: string | null;
  carater_atendimento: string | null;
  tipo_internacao: string | null;
  regime_internacao: string | null;
  diarias_solicitadas: number | null;
  previsao_opme: boolean;
  previsao_quimioterapico: boolean;
  indicacao_clinica: string;
  cid_principal: string | null;
  cid_2: string | null;
  cid_3: string | null;
  cid_4: string | null;
  indicacao_acidente: string | null;
  procedimentos: string | null;
  observacoes: string | null;
  pacientes: {
    id: string;
    nome: string;
    cpf: string | null;
  };
}

export interface InternacaoDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string | null;
  hospital_nome?: string | null;
  data_sugerida_internacao?: string | null;
  carater_atendimento?: string | null;
  tipo_internacao?: string | null;
  regime_internacao?: string | null;
  diarias_solicitadas?: number | null;
  previsao_opme?: boolean;
  previsao_quimioterapico?: boolean;
  indicacao_clinica?: string | null;
  cid_principal?: string | null;
  cid_2?: string | null;
  cid_3?: string | null;
  cid_4?: string | null;
  indicacao_acidente?: string | null;
  procedimentos?: string | null;
  observacoes?: string | null;
}

export interface InternacaoComPaciente {
  id: string;
  data: string | null;
  hospital_nome: string | null;
  data_sugerida_internacao: string | null;
  carater_atendimento: string | null;
  tipo_internacao: string | null;
  regime_internacao: string | null;
  diarias_solicitadas: number | null;
  previsao_opme: boolean;
  previsao_quimioterapico: boolean;
  indicacao_clinica: string;
  cid_principal: string | null;
  cid_2: string | null;
  cid_3: string | null;
  cid_4: string | null;
  indicacao_acidente: string | null;
  procedimentos: string | null;
  observacoes: string | null;
  pacientes: InternacaoPaciente;
}

export const INDICACAO_CLINICA_MAX_LENGTH = 5000;
export const PROCEDIMENTOS_MAX_LENGTH = 5000;
export { OBSERVACOES_MAX_LENGTH } from "@/lib/validators";

// --- Labels ---

export const CARATER_LABELS: Record<string, string> = {
  eletiva: "Eletiva",
  urgencia: "Urgência",
  emergencia: "Emergência",
};

export const TIPO_INTERNACAO_LABELS: Record<string, string> = {
  clinica: "Clínica",
  cirurgica: "Cirúrgica",
  obstetrica: "Obstétrica",
  psiquiatrica: "Psiquiátrica",
  pediatrica: "Pediátrica",
};

export const REGIME_LABELS: Record<string, string> = {
  hospitalar: "Hospitalar",
  hospital_dia: "Hospital-dia",
};

export const INDICACAO_ACIDENTE_LABELS: Record<string, string> = {
  acidente_trabalho: "Acidente de trabalho",
  acidente_transito: "Acidente de trânsito",
  outros_acidentes: "Outros acidentes",
  nao: "Não",
};

// --- Listas para selects ---

export const CARACTERES_ATENDIMENTO = ["eletiva", "urgencia", "emergencia"] as const;
export const TIPOS_INTERNACAO = ["clinica", "cirurgica", "obstetrica", "psiquiatrica", "pediatrica"] as const;
export const REGIMES_INTERNACAO = ["hospitalar", "hospital_dia"] as const;
export const INDICACOES_ACIDENTE = ["acidente_trabalho", "acidente_transito", "outros_acidentes", "nao"] as const;

// --- Helpers de formatação (re-exports) ---
export { formatDate, formatDateLong, formatDateMedium, getInitials, formatCPF } from "@/lib/format";
