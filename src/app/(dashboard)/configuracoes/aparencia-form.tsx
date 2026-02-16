"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { salvarProfissional, type ConfigFormState } from "./actions";
import { THEME_OPTIONS, type ThemeName } from "@/lib/theme";

const SWATCH_COLORS: Record<ThemeName, string> = {
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
};

export function AparenciaForm({
  defaults,
}: {
  defaults: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    salvarProfissional,
    {}
  );

  const [formKey, setFormKey] = useState(0);
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setFormKey((k) => k + 1);
  }

  useEffect(() => {
    if (state.success) {
      toast.success("Configurações salvas com sucesso.");
      window.location.reload();
    }
  }, [state]);

  const currentTheme = defaults.cor_primaria || "sky";

  return (
    <form key={formKey} action={formAction} className="space-y-4 sm:space-y-6" aria-busy={isPending}>
      <FormError message={state.error} />

      <fieldset>
        <legend className="text-sm font-medium text-gray-700">Cor primária</legend>
        <p className="mt-1 text-sm text-gray-500">
          Escolha a cor principal da interface do sistema.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => (
            <label
              key={option.key}
              className={`relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                currentTheme === option.key
                  ? "border-primary-600 ring-1 ring-primary-600"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="config_cor_primaria"
                value={option.key}
                defaultChecked={currentTheme === option.key}
                disabled={isPending}
                className="sr-only"
              />
              <span
                className={`h-8 w-8 shrink-0 rounded-full ${SWATCH_COLORS[option.key]}`}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-gray-900">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end border-t border-gray-200 pt-4 sm:pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}
