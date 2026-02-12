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

export const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  atendido: "Atendido",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

export const STATUS_STYLES: Record<string, string> = {
  agendado: "bg-blue-100 text-blue-700",
  confirmado: "bg-sky-100 text-sky-700",
  em_atendimento: "bg-amber-100 text-amber-700",
  atendido: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
  faltou: "bg-gray-100 text-gray-600",
};

export function formatTime(time: string) {
  return time.slice(0, 5);
}

export function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
