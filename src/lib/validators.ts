type FieldErrors = Record<string, string>;

export function campoObrigatorio(
  errors: FieldErrors,
  campo: string,
  valor: string | null | undefined,
  mensagem?: string
): boolean {
  if (!valor || valor.trim() === "") {
    errors[campo] = mensagem ?? "Campo obrigatório.";
    return false;
  }
  return true;
}

export function tamanhoMaximo(
  errors: FieldErrors,
  campo: string,
  valor: string | null | undefined,
  max: number
): void {
  if (valor && valor.length > max) {
    errors[campo] = `Máximo de ${max} caracteres.`;
  }
}

export function dataNaoFutura(
  errors: FieldErrors,
  campo: string,
  valor: string | null | undefined,
  mensagem?: string
): void {
  if (!valor) return;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (valor > today) {
    errors[campo] = mensagem ?? "A data não pode ser no futuro.";
  }
}

export function emailValido(
  errors: FieldErrors,
  campo: string,
  valor: string | null | undefined
): void {
  if (!valor) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    errors[campo] = "E-mail inválido.";
  }
}

export function valorPermitido(
  errors: FieldErrors,
  campo: string,
  valor: string | null | undefined,
  permitidos: readonly string[],
  mensagem?: string
): void {
  if (!valor) return;
  if (!permitidos.includes(valor)) {
    errors[campo] = mensagem ?? "Valor inválido.";
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function uuidValido(valor: string | null | undefined): boolean {
  return !!valor && UUID_RE.test(valor);
}
