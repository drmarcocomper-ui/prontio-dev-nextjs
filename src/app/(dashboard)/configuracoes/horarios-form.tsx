"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { salvarHorarios, type ConfigFormState } from "./actions";
import { INPUT_CLASS, DIAS } from "./constants";

export function HorariosForm({
  defaults,
}: {
  defaults: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    salvarHorarios,
    {}
  );

  const [formKey, setFormKey] = useState(0);
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setFormKey((k) => k + 1);
  }

  useEffect(() => {
    if (state.success) toast.success("Configurações salvas com sucesso.");
  }, [state]);

  return (
    <form key={formKey} action={formAction} className="space-y-4 sm:space-y-6" aria-busy={isPending}>
      <FormError message={state.error} />

      {/* Duração padrão */}
      <div className="max-w-xs">
        <label htmlFor="duracao_consulta" className="block text-sm font-medium text-gray-700">
          Duração padrão da consulta (minutos)
        </label>
        <input
          id="duracao_consulta"
          name="config_duracao_consulta"
          type="number"
          min="5"
          max="240"
          step="5"
          disabled={isPending}
          defaultValue={defaults.duracao_consulta ?? "15"}
          className={INPUT_CLASS}
        />
      </div>

      {/* Horários por dia */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Horário de atendimento
        </p>
        <div className="rounded-lg border border-gray-200">
          {DIAS.map((dia, i) => (
            <div
              key={dia.key}
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
                i > 0 ? "border-t border-gray-200" : ""
              }`}
            >
              <span className="w-full sm:w-36 text-sm font-medium text-gray-700">
                {dia.label}
              </span>
              <input
                name={`config_horario_${dia.key}_inicio`}
                type="time"
                step="300"
                disabled={isPending}
                defaultValue={defaults[`horario_${dia.key}_inicio`] ?? "08:00"}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-400">até</span>
              <input
                name={`config_horario_${dia.key}_fim`}
                type="time"
                step="300"
                disabled={isPending}
                defaultValue={defaults[`horario_${dia.key}_fim`] ?? "18:00"}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Intervalo de almoço */}
      <div>
        <p className="text-sm font-medium text-gray-700">Intervalo</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <input
            name="config_intervalo_inicio"
            type="time"
            step="300"
            disabled={isPending}
            defaultValue={defaults.intervalo_inicio ?? "12:00"}
            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
          />
          <span className="text-sm text-gray-400">até</span>
          <input
            name="config_intervalo_fim"
            type="time"
            step="300"
            disabled={isPending}
            defaultValue={defaults.intervalo_fim ?? "13:00"}
            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
          />
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
