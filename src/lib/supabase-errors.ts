type Operacao = "criar" | "atualizar" | "excluir" | "salvar" | "buscar";

const PG_ERROR_MAP: Record<string, (operacao: Operacao, entidade: string) => string> = {
  "23505": () =>
    "Já existe um registro com esses dados. Verifique e tente novamente.",
  "23503": (operacao) =>
    operacao === "excluir"
      ? "Não é possível excluir: existem registros vinculados."
      : "Referência inválida. Verifique os dados e tente novamente.",
  "42501": () => "Sem permissão para realizar esta operação.",
  PGRST301: () => "Sessão expirada. Faça login novamente.",
};

export function tratarErroSupabase(
  error: { code?: string; message?: string } | null,
  operacao: Operacao,
  entidade: string
): string {
  if (!error) {
    return `Erro ao ${operacao} ${entidade}. Tente novamente.`;
  }

  const code = error.code ?? "";
  const handler = PG_ERROR_MAP[code];
  if (handler) {
    return handler(operacao, entidade);
  }

  return `Erro ao ${operacao} ${entidade}. Tente novamente.`;
}
