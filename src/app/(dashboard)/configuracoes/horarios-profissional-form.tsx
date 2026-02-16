"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { salvarHorariosProfissional, type ConfigFormState } from "./actions";
import type { HorarioProfissional } from "@/app/(dashboard)/agenda/utils";

const DIAS = [
  { key: "seg", label: "Segunda", dia_semana: 1 },
  { key: "ter", label: "Terça", dia_semana: 2 },
  { key: "qua", label: "Quarta", dia_semana: 3 },
  { key: "qui", label: "Quinta", dia_semana: 4 },
  { key: "sex", label: "Sexta", dia_semana: 5 },
  { key: "sab", label: "Sábado", dia_semana: 6 },
  { key: "dom", label: "Domingo", dia_semana: 0 },
];

const DEFAULTS: HorarioProfissional[] = [
  { dia_semana: 0, ativo: false, hora_inicio: null, hora_fim: null, intervalo_inicio: null, intervalo_fim: null, duracao_consulta: 15 },
  { dia_semana: 1, ativo: true, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: "12:00", intervalo_fim: "13:00", duracao_consulta: 15 },
  { dia_semana: 2, ativo: true, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: "12:00", intervalo_fim: "13:00", duracao_consulta: 15 },
  { dia_semana: 3, ativo: true, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: "12:00", intervalo_fim: "13:00", duracao_consulta: 15 },
  { dia_semana: 4, ativo: true, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: "12:00", intervalo_fim: "13:00", duracao_consulta: 15 },
  { dia_semana: 5, ativo: true, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: "12:00", intervalo_fim: "13:00", duracao_consulta: 15 },
  { dia_semana: 6, ativo: true, hora_inicio: "08:00", hora_fim: "12:00", intervalo_inicio: null, intervalo_fim: null, duracao_consulta: 15 },
];

function buildInitialState(defaults: HorarioProfissional[]): HorarioProfissional[] {
  // Map by dia_semana order matching DIAS array
  return DIAS.map((dia) => {
    const saved = defaults.find((d) => d.dia_semana === dia.dia_semana);
    const fallback = DEFAULTS.find((d) => d.dia_semana === dia.dia_semana)!;
    return saved ?? fallback;
  });
}

const TIME_CLASS =
  "w-[7rem] rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50";

export function HorariosProfissionalForm({
  defaults,
}: {
  defaults: HorarioProfissional[];
}) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    salvarHorariosProfissional,
    {}
  );

  const [formKey, setFormKey] = useState(0);
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setFormKey((k) => k + 1);
  }

  const [horarios, setHorarios] = useState(() => buildInitialState(defaults));
  const duracao = horarios[0]?.duracao_consulta ?? 15;

  useEffect(() => {
    if (state.success) toast.success("Horários salvos com sucesso.");
  }, [state]);

  function toggleDia(idx: number) {
    setHorarios((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, ativo: !h.ativo } : h))
    );
  }

  function updateField(idx: number, field: keyof HorarioProfissional, value: string | null) {
    setHorarios((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, [field]: value } : h))
    );
  }

  function updateDuracao(value: number) {
    setHorarios((prev) => prev.map((h) => ({ ...h, duracao_consulta: value })));
  }

  return (
    <form key={formKey} action={formAction} className="space-y-5" aria-busy={isPending}>
      <FormError message={state.error} />

      {/* Duração */}
      <div className="max-w-xs">
        <label htmlFor="duracao_profissional" className="block text-sm font-medium text-gray-700">
          Duração da consulta (minutos)
        </label>
        <input
          id="duracao_profissional"
          name="duracao_consulta"
          type="number"
          min="5"
          max="240"
          step="5"
          disabled={isPending}
          value={duracao}
          onChange={(e) => updateDuracao(parseInt(e.target.value, 10) || 15)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
        />
      </div>

      {/* Dias da semana */}
      <div className="space-y-2">
        {DIAS.map((dia, i) => {
          const h = horarios[i];
          return (
            <div
              key={dia.key}
              className={`rounded-lg border ${h.ativo ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}`}
            >
              {/* Hidden fields */}
              <input type="hidden" name={`ativo_${dia.key}`} value={h.ativo ? "true" : "false"} />
              {h.ativo && (
                <>
                  <input type="hidden" name={`hora_inicio_${dia.key}`} value={h.hora_inicio ?? ""} />
                  <input type="hidden" name={`hora_fim_${dia.key}`} value={h.hora_fim ?? ""} />
                  <input type="hidden" name={`intervalo_inicio_${dia.key}`} value={h.intervalo_inicio ?? ""} />
                  <input type="hidden" name={`intervalo_fim_${dia.key}`} value={h.intervalo_fim ?? ""} />
                </>
              )}

              {/* Header do dia: toggle + nome */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={h.ativo}
                  disabled={isPending}
                  onClick={() => toggleDia(i)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
                    h.ativo ? "bg-primary-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      h.ativo ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${h.ativo ? "text-gray-900" : "text-gray-400"}`}>
                  {dia.label}
                </span>
                {!h.ativo && (
                  <span className="text-xs text-gray-400">Folga</span>
                )}
              </div>

              {/* Campos de horário (só quando ativo) */}
              {h.ativo && (
                <div className="border-t border-gray-100 px-4 pb-3 pt-2 space-y-2">
                  {/* Expediente */}
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-xs font-medium text-gray-500">Expediente</span>
                    <input
                      type="time"
                      step="300"
                      disabled={isPending}
                      value={h.hora_inicio ?? "08:00"}
                      onChange={(e) => updateField(i, "hora_inicio", e.target.value || null)}
                      className={TIME_CLASS}
                    />
                    <span className="text-xs text-gray-400">às</span>
                    <input
                      type="time"
                      step="300"
                      disabled={isPending}
                      value={h.hora_fim ?? "18:00"}
                      onChange={(e) => updateField(i, "hora_fim", e.target.value || null)}
                      className={TIME_CLASS}
                    />
                  </div>
                  {/* Intervalo */}
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-xs font-medium text-gray-500">Intervalo</span>
                    <input
                      type="time"
                      step="300"
                      disabled={isPending}
                      value={h.intervalo_inicio ?? ""}
                      onChange={(e) => updateField(i, "intervalo_inicio", e.target.value || null)}
                      className={TIME_CLASS}
                    />
                    <span className="text-xs text-gray-400">às</span>
                    <input
                      type="time"
                      step="300"
                      disabled={isPending}
                      value={h.intervalo_fim ?? ""}
                      onChange={(e) => updateField(i, "intervalo_fim", e.target.value || null)}
                      className={TIME_CLASS}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
