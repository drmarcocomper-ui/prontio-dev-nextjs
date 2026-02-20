import { parseLocalDate } from "@/lib/date";

export interface PacienteListItem {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
}

export interface Paciente {
  id: string;
  nome: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  estado_civil: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  convenio: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface PacienteDefaults {
  id?: string;
  nome?: string;
  cpf?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  sexo?: string | null;
  estado_civil?: string | null;
  telefone?: string | null;
  email?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  convenio?: string | null;
  observacoes?: string | null;
}

// --- Constantes de max length ---

export const NOME_MAX_LENGTH = 255;
export const RG_MAX_LENGTH = 20;
export const EMAIL_MAX_LENGTH = 254;
export const ENDERECO_MAX_LENGTH = 255;
export const NUMERO_MAX_LENGTH = 20;
export const COMPLEMENTO_MAX_LENGTH = 100;
export const BAIRRO_MAX_LENGTH = 100;
export const CIDADE_MAX_LENGTH = 100;
export { OBSERVACOES_MAX_LENGTH } from "@/lib/validators";

// --- Labels ---

export type ConvenioTipo =
  | "amil" | "banescaixa" | "bestsenior" | "bradesco" | "capesaude"
  | "castelo_em_vida" | "cesan_faeces" | "codesa" | "cortesia" | "cst"
  | "geap" | "marinha" | "mediservice" | "medsenior" | "particular"
  | "pasa" | "petrobras" | "postal_saude" | "samp"
  | "santa_casa_saude" | "sao_bernardo" | "sao_lazaro" | "saude_caixa"
  | "sulamerica" | "telemedicina" | "unimed" | "usiminas" | "usisaude" | "vale";

export const CONVENIO_LABELS: Record<ConvenioTipo, string> = {
  amil: "Amil",
  banescaixa: "Banescaixa",
  bestsenior: "Bestsênior",
  bradesco: "Bradesco",
  capesaude: "Capesaúde",
  castelo_em_vida: "Castelo em Vida",
  cesan_faeces: "Cesan/Faeces",
  codesa: "Codesa",
  cortesia: "Cortesia",
  cst: "CST",
  geap: "GEAP",
  marinha: "Marinha",
  mediservice: "Mediservice",
  medsenior: "Medsênior",
  particular: "Particular",
  pasa: "Pasa",
  petrobras: "Petrobras",
  postal_saude: "Postal Saúde",
  samp: "Samp",
  santa_casa_saude: "Santa Casa Saúde",
  sao_bernardo: "São Bernardo",
  sao_lazaro: "São Lázaro",
  saude_caixa: "Saúde Caixa",
  sulamerica: "SulAmérica",
  telemedicina: "Telemedicina",
  unimed: "Unimed",
  usiminas: "Usiminas",
  usisaude: "USISAUDE",
  vale: "Vale",
};

export const SEXO_LABELS: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};

export const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  uniao_estavel: "União estável",
};

import { TIPO_LABELS as _TIPO_LABELS } from "../agenda/types";
export const TIPO_LABELS: Record<string, string> = _TIPO_LABELS;

export const RECEITA_TIPO_LABELS: Record<string, string> = {
  simples: "Simples",
  especial: "Especial",
  controle_especial: "Controle Especial",
};

export const ATESTADO_TIPO_LABELS: Record<string, string> = {
  comparecimento: "Comparecimento",
  afastamento: "Afastamento",
  aptidao: "Aptidão / Saúde",
  acompanhante: "Acompanhante",
};

export const ESTADOS_UF = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// --- Validação CPF ---

export function validarCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(cpf[10])) return false;

  return true;
}

// --- Helpers de formatação (re-exports) ---
export { formatCPF, formatPhone, formatCEP, formatDate, getInitials } from "@/lib/format";
export { maskCPF, maskPhone, maskCEP } from "@/lib/masks";

export function calcAge(dateStr: string) {
  const birth = parseLocalDate(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
