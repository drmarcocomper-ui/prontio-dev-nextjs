"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS } from "@/components/form-utils";
import { criarAgendamento, atualizarAgendamento, type AgendamentoFormState } from "../actions";
import { type AgendamentoDefaults, OBSERVACOES_MAX_LENGTH, TIPO_LABELS } from "../types";
import { PatientSearch } from "./patient-search";

export function AgendamentoForm({
  defaultDate,
  defaultTime,
  defaults,
  medicoId,
}: {
  defaultDate?: string;
  defaultTime?: string;
  defaults?: AgendamentoDefaults;
  medicoId: string;
}) {
  const isEditing = !!defaults?.id;
  const action = isEditing ? atualizarAgendamento : criarAgendamento;
  const dateValue = defaults?.data ?? defaultDate ?? "";

  const [state, formAction, isPending] = useActionState<AgendamentoFormState, FormData>(
    action,
    {}
  );

  const cancelHref = isEditing ? `/agenda/${defaults.id}` : `/agenda?data=${dateValue}`;

  return (
    <form action={formAction} className="space-y-6" aria-busy={isPending}>
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      <FormError message={state.error} />

      {/* Paciente */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Paciente <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <PatientSearch
            defaultPatientId={defaults?.paciente_id}
            defaultPatientName={defaults?.paciente_nome}
            medicoId={medicoId}
          />
        </div>
        <FieldError message={state.fieldErrors?.paciente_id} />
      </div>

      {/* Data e horário */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="data" className="block text-sm font-medium text-gray-700">
            Data <span className="text-red-500">*</span>
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            disabled={isPending}
            defaultValue={dateValue}
            className={INPUT_CLASS}
          />
          <FieldError message={state.fieldErrors?.data} />
        </div>

        <div>
          <label htmlFor="hora_inicio" className="block text-sm font-medium text-gray-700">
            Início <span className="text-red-500">*</span>
          </label>
          <input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            step="300"
            required
            disabled={isPending}
            defaultValue={defaults?.hora_inicio ?? defaultTime ?? ""}
            className={INPUT_CLASS}
          />
          <FieldError message={state.fieldErrors?.hora_inicio} />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={defaults?.tipo ?? ""}
          disabled={isPending}
          className={INPUT_CLASS}
        >
          <option value="">Selecione</option>
          {Object.entries(TIPO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.tipo} />
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          maxLength={OBSERVACOES_MAX_LENGTH}
          disabled={isPending}
          defaultValue={defaults?.observacoes ?? ""}
          className={INPUT_CLASS}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
        <Link
          href={cancelHref}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 w-full sm:w-auto text-center"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50 w-full sm:w-auto"
        >
          {isPending && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isEditing ? "Salvar alterações" : "Agendar"}
        </button>
      </div>
    </form>
  );
}
