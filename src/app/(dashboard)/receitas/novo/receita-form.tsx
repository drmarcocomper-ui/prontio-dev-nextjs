"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FieldError, INPUT_CLASS } from "@/components/form-utils";
import { criarReceita, atualizarReceita, type ReceitaFormState } from "../actions";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import {
  type ReceitaDefaults,
  MEDICAMENTOS_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  TIPO_LABELS,
} from "../types";

export function ReceitaForm({
  defaults,
  cancelHref,
}: {
  defaults?: ReceitaDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const today = new Date().toISOString().split("T")[0];

  const action = isEditing ? atualizarReceita : criarReceita;

  const [state, formAction, isPending] = useActionState<ReceitaFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/receitas/${defaults?.id}` : "/receitas");

  return (
    <form action={formAction} className="space-y-6" aria-busy={isPending}>
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Paciente e Data */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Paciente <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <PatientSearch
              defaultPatientId={defaults?.paciente_id}
              defaultPatientName={defaults?.paciente_nome}
            />
          </div>
          <FieldError message={state.fieldErrors?.paciente_id} />
        </div>

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
            max={today}
            defaultValue={defaults?.data ?? today}
            className={INPUT_CLASS}
          />
          <FieldError message={state.fieldErrors?.data} />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo da receita <span className="text-red-500">*</span>
        </label>
        <select id="tipo" name="tipo" required disabled={isPending} defaultValue={defaults?.tipo ?? ""} className={INPUT_CLASS}>
          <option value="">Selecione</option>
          {Object.entries(TIPO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.tipo} />
      </div>

      {/* Medicamentos */}
      <div>
        <label htmlFor="medicamentos" className="block text-sm font-medium text-gray-700">
          Medicamentos <span className="text-red-500">*</span>
        </label>
        <textarea
          id="medicamentos"
          name="medicamentos"
          rows={8}
          required
          disabled={isPending}
          maxLength={MEDICAMENTOS_MAX_LENGTH}
          placeholder="Liste os medicamentos, dosagens e posologias..."
          defaultValue={defaults?.medicamentos ?? ""}
          className={INPUT_CLASS}
        />
        <FieldError message={state.fieldErrors?.medicamentos} />
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          disabled={isPending}
          maxLength={OBSERVACOES_MAX_LENGTH}
          defaultValue={defaults?.observacoes ?? ""}
          className={INPUT_CLASS}
        />
        <FieldError message={state.fieldErrors?.observacoes} />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
        <Link
          href={cancel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 w-full sm:w-auto text-center"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50 w-full sm:w-auto"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isEditing ? "Salvar alterações" : "Salvar receita"}
        </button>
      </div>
    </form>
  );
}
