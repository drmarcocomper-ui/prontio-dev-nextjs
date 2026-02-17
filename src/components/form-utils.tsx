export const INPUT_CLASS =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50";

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return <p id={id} role="alert" className="mt-1 text-xs text-red-600">{message}</p>;
}

/** Retorna props de aria para vincular um input ao seu FieldError. */
export function ariaProps(fieldName: string, error?: string) {
  return {
    "aria-invalid": error ? true as const : undefined,
    "aria-describedby": error ? `${fieldName}-error` : undefined,
  };
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function SubmitButton({ label, isPending }: { label: string; isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
    >
      {isPending && (
        <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {label}
    </button>
  );
}
