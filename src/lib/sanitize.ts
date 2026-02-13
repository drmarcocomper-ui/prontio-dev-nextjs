/** Escapa caracteres especiais para uso em filtros PostgREST LIKE */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}
