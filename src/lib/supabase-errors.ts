type Operacao = "criar" | "atualizar" | "excluir" | "salvar" | "buscar";

const PG_ERROR_MAP: Record<string, (operacao: Operacao, entidade: string) => string> = {
  "23505": () =>
    "Ja existe um registro com esses dados. Verifique e tente novamente.",
  "23503": (operacao) =>
    operacao === "excluir"
      ? "Nao e possivel excluir: existem registros vinculados."
      : "Referencia invalida. Verifique os dados e tente novamente.",
  "42501": () => "Sem permissao para realizar esta operacao.",
  PGRST301: () => "Sessao expirada. Faca login novamente.",
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
