export interface ProntuarioPaciente {
  id: string;
  nome: string;
}

export interface Prontuario {
  id: string;
  data: string;
  tipo: string | null;
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
  tipo: string | null;
  cid: string | null;
  queixa_principal: string | null;
  conduta: string | null;
  pacientes: ProntuarioPaciente;
}

export interface ProntuarioDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string;
  tipo?: string | null;
  cid?: string | null;
  queixa_principal?: string | null;
  historia_doenca?: string | null;
  exame_fisico?: string | null;
  hipotese_diagnostica?: string | null;
  conduta?: string | null;
  observacoes?: string | null;
}

export const TEXTO_MAX_LENGTH = 5000;
export const OBSERVACOES_MAX_LENGTH = 1000;
export const CID_MAX_LENGTH = 20;

export const TIPO_LABELS: Record<string, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  avaliacao: "Avaliação",
};

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

export function formatDateLong(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
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
