"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { salvarValores, type ConfigFormState } from "./actions";
import { CONVENIO_LABELS, type ConvenioTipo } from "../pacientes/types";
import { maskCurrency } from "@/lib/masks";

function formatDefaultValue(valor: string | undefined): string {
  if (!valor) return "";
  const num = parseFloat(valor);
  if (isNaN(num)) return "";
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ValoresForm({
  defaults,
}: {
  defaults: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    salvarValores,
    {}
  );

  useEffect(() => {
    if (state.success) toast.success("Valores salvos com sucesso.");
  }, [state]);

  const convenios = Object.entries(CONVENIO_LABELS) as [ConvenioTipo, string][];

  return (
    <form action={formAction} className="space-y-4 sm:space-y-6" aria-busy={isPending}>
      <FormError message={state.error} />

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Valor da consulta por convênio
        </p>
        <div className="rounded-lg border border-gray-200">
          {convenios.map(([key, label], i) => {
            const isCortesia = key === "cortesia";
            return (
              <div
                key={key}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
                  i > 0 ? "border-t border-gray-200" : ""
                }`}
              >
                <span className="w-full sm:w-44 text-sm font-medium text-gray-700">
                  {label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-500">R$</span>
                  <input
                    name={isCortesia ? undefined : `config_valor_convenio_${key}`}
                    type="text"
                    inputMode="numeric"
                    disabled={isPending || isCortesia}
                    defaultValue={isCortesia ? "0,00" : formatDefaultValue(defaults[`valor_convenio_${key}`])}
                    onChange={isCortesia ? undefined : (e) => {
                      e.target.value = maskCurrency(e.target.value);
                    }}
                    className="w-28 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
