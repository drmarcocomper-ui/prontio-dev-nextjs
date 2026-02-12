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
  tipo: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  pacientes: AgendamentoPaciente;
}

export interface AgendamentoDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string;
  hora_inicio?: string;
  hora_fim?: string;
  tipo?: string | null;
  observacoes?: string | null;
}

export const OBSERVACOES_MAX_LENGTH = 1000;

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  agendado: ["confirmado", "cancelado", "faltou"],
  confirmado: ["em_atendimento", "cancelado", "faltou"],
  em_atendimento: ["atendido", "cancelado"],
  atendido: [],
  cancelado: ["agendado"],
  faltou: ["agendado"],
};

export const TIPO_LABELS: Record<string, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  avaliacao: "Avaliação",
};

export function formatTime(time: string) {
  return time.slice(0, 5);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
