export interface Transacao {
  id: string;
  tipo: string;
  categoria: string | null;
  descricao: string;
  valor: number;
  data: string;
  paciente_id: string | null;
  forma_pagamento: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  pacientes: { nome: string } | null;
}

export interface TransacaoFull {
  id: string;
  tipo: string;
  categoria: string | null;
  descricao: string;
  valor: number;
  data: string;
  paciente_id: string | null;
  forma_pagamento: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  pacientes: { id: string; nome: string } | null;
}

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

export const PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  boleto: "Boleto",
  transferencia: "Transferência",
  convenio: "Convênio",
};

export const STATUS_STYLES: Record<string, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}
