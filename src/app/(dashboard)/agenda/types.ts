export type AgendaStatus = "agendado" | "confirmado" | "em_atendimento" | "atendido" | "cancelado" | "faltou";
export type AgendaTipo = "consulta" | "retorno" | "exame" | "procedimento" | "avaliacao";

export interface AgendamentoPaciente {
  id: string;
  nome: string;
  telefone?: string | null;
}

export interface Agendamento {
  id: string;
  paciente_id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  tipo: AgendaTipo | null;
  status: AgendaStatus;
  observacoes: string | null;
  created_at: string;
  updated_at?: string | null;
  pacientes: AgendamentoPaciente;
}

export interface AgendamentoDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string;
  hora_inicio?: string;
  tipo?: AgendaTipo | null;
  observacoes?: string | null;
}

export const OBSERVACOES_MAX_LENGTH = 1000;

export const STATUS_TRANSITIONS: Record<AgendaStatus, AgendaStatus[]> = {
  agendado: ["confirmado", "cancelado", "faltou"],
  confirmado: ["em_atendimento", "cancelado", "faltou"],
  em_atendimento: ["atendido", "cancelado"],
  atendido: [],
  cancelado: ["agendado"],
  faltou: ["agendado"],
};

export const TIPO_LABELS: Record<AgendaTipo, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  avaliacao: "Avaliação",
};

export const STATUS_LABELS: Record<AgendaStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  atendido: "Atendido",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

export const STATUS_STYLES: Record<AgendaStatus, string> = {
  agendado: "bg-blue-100 text-blue-700",
  confirmado: "bg-blue-100 text-blue-700",
  em_atendimento: "bg-amber-100 text-amber-700",
  atendido: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
  faltou: "bg-gray-100 text-gray-600",
};

// --- Helpers de formatação (re-exports) ---
export { formatTime, formatDateBR, getInitials } from "@/lib/format";
