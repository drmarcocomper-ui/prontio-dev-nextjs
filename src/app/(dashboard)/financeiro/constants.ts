export type TransacaoTipo = "receita" | "despesa";
export type TransacaoStatus = "pago" | "pendente" | "cancelado";
export type FormaPagamento = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto" | "transferencia" | "convenio";

export interface TransacaoListItem {
  id: string;
  tipo: TransacaoTipo;
  categoria: string | null;
  descricao: string;
  valor: number;
  data: string;
  forma_pagamento: FormaPagamento | null;
  status: TransacaoStatus;
  pacientes: { nome: string } | null;
}

export interface Transacao {
  id: string;
  tipo: TransacaoTipo;
  categoria: string | null;
  descricao: string;
  valor: number;
  data: string;
  paciente_id: string | null;
  forma_pagamento: FormaPagamento | null;
  status: TransacaoStatus;
  observacoes: string | null;
  created_at: string;
  pacientes: { nome: string } | null;
}

export interface TransacaoFull {
  id: string;
  tipo: TransacaoTipo;
  categoria: string | null;
  descricao: string;
  valor: number;
  data: string;
  paciente_id: string | null;
  forma_pagamento: FormaPagamento | null;
  status: TransacaoStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string | null;
  pacientes: { id: string; nome: string } | null;
}

export interface TransacaoDefaults {
  id?: string;
  tipo?: TransacaoTipo;
  categoria?: string | null;
  descricao?: string;
  valor?: string;
  data?: string;
  paciente_id?: string | null;
  paciente_nome?: string | null;
  forma_pagamento?: FormaPagamento | null;
  status?: TransacaoStatus;
  observacoes?: string | null;
}

export const DESCRICAO_MAX_LENGTH = 255;
export const OBSERVACOES_MAX_LENGTH = 1000;
export const VALOR_MAX = 999999.99;

export const CATEGORIA_LABELS: Record<string, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  aluguel: "Aluguel",
  salario: "Salário",
  material: "Material",
  equipamento: "Equipamento",
  imposto: "Imposto",
  outros: "Outros",
};

export const PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  boleto: "Boleto",
  transferencia: "Transferência",
  convenio: "Convênio",
};

export const STATUS_LABELS: Record<TransacaoStatus, string> = {
  pago: "Pago",
  pendente: "Pendente",
  cancelado: "Cancelado",
};

export const STATUS_STYLES: Record<TransacaoStatus, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

export const CATEGORIAS_RECEITA = [
  { value: "consulta", label: "Consulta" },
  { value: "retorno", label: "Retorno" },
  { value: "exame", label: "Exame" },
  { value: "procedimento", label: "Procedimento" },
  { value: "outros", label: "Outros" },
];

export const CATEGORIAS_DESPESA = [
  { value: "aluguel", label: "Aluguel" },
  { value: "salario", label: "Salário" },
  { value: "material", label: "Material" },
  { value: "equipamento", label: "Equipamento" },
  { value: "imposto", label: "Imposto" },
  { value: "outros", label: "Outros" },
];

// --- Helpers de formatação (re-exports) ---
export { formatCurrency, formatDate, formatDateLong, getInitials } from "@/lib/format";
export { maskCurrency } from "@/lib/masks";
