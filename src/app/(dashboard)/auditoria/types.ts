export interface AuditLog {
  id: string;
  user_id: string;
  clinica_id: string | null;
  acao: string;
  recurso: string;
  recurso_id: string | null;
  detalhes: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogWithEmail extends AuditLog {
  user_email: string;
}

export const ACAO_LABELS: Record<string, string> = {
  criar: "Criar",
  atualizar: "Atualizar",
  excluir: "Excluir",
  login: "Login",
  logout: "Logout",
  exportar: "Exportar",
  imprimir: "Imprimir",
  backup: "Backup",
};

export const RECURSO_LABELS: Record<string, string> = {
  paciente: "Paciente",
  agendamento: "Agendamento",
  prontuario: "Prontuário",
  receita: "Receita",
  exame: "Exame",
  transacao: "Transação",
  configuracao: "Configuração",
  usuario: "Usuário",
  clinica: "Clínica",
  atestado: "Atestado",
  encaminhamento: "Encaminhamento",
};

export const ACAO_BADGE: Record<string, string> = {
  criar: "bg-green-50 text-green-700",
  atualizar: "bg-blue-50 text-blue-700",
  excluir: "bg-red-50 text-red-700",
  login: "bg-gray-50 text-gray-700",
  logout: "bg-gray-50 text-gray-700",
  exportar: "bg-purple-50 text-purple-700",
  imprimir: "bg-indigo-50 text-indigo-700",
  backup: "bg-amber-50 text-amber-700",
};
