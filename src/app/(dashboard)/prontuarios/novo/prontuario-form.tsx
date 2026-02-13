"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS } from "@/components/form-utils";
import { criarProntuario, atualizarProntuario, type ProntuarioFormState } from "../actions";
import { type ProntuarioDefaults, TEXTO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH, CID_MAX_LENGTH, TIPO_LABELS } from "../types";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";

export function ProntuarioForm({
  defaults,
  cancelHref,
}: {
  defaults?: ProntuarioDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const today = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();

  const action = isEditing ? atualizarProntuario : criarProntuario;

  const [state, formAction, isPending] = useActionState<ProntuarioFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/prontuarios/${defaults?.id}` : "/prontuarios");

  return (
    <form action={formAction} className="space-y-6" aria-busy={isPending}>
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      <FormError message={state.error} />

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

      {/* Tipo e CID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select id="tipo" name="tipo" defaultValue={defaults?.tipo ?? ""} disabled={isPending} className={INPUT_CLASS}>
            <option value="">Selecione</option>
            {Object.entries(TIPO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cid" className="block text-sm font-medium text-gray-700">
            CID
          </label>
          <input
            id="cid"
            name="cid"
            type="text"
            placeholder="Ex: J06.9"
            maxLength={CID_MAX_LENGTH}
            disabled={isPending}
            defaultValue={defaults?.cid ?? ""}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Campos SOAP / Evolução clínica */}
      <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
        <legend className="px-2 text-sm font-semibold text-gray-900">
          Evolução clínica
        </legend>

        <div>
          <label htmlFor="queixa_principal" className="block text-sm font-medium text-gray-700">
            Queixa principal
          </label>
          <textarea
            id="queixa_principal"
            name="queixa_principal"
            rows={2}
            maxLength={TEXTO_MAX_LENGTH}
            disabled={isPending}
            placeholder="Motivo da consulta..."
            defaultValue={defaults?.queixa_principal ?? ""}
            className={INPUT_CLASS}
          />
          <FieldError message={state.fieldErrors?.queixa_principal} />
        </div>

        <div>
          <label htmlFor="historia_doenca" className="block text-sm font-medium text-gray-700">
            História da doença atual
          </label>
          <textarea
            id="historia_doenca"
            name="historia_doenca"
            rows={3}
            maxLength={TEXTO_MAX_LENGTH}
            disabled={isPending}
            placeholder="Evolução dos sintomas, duração, fatores de melhora/piora..."
            defaultValue={defaults?.historia_doenca ?? ""}
            className={INPUT_CLASS}
          />
          <FieldError message={state.fieldErrors?.historia_doenca} />
        </div>

        <div>
          <label htmlFor="exame_fisico" className="block text-sm font-medium text-gray-700">
            Exame físico
          </label>
          <textarea
            id="exame_fisico"
            name="exame_fisico"
            rows={3}
            maxLength={TEXTO_MAX_LENGTH}
            disabled={isPending}
            placeholder="Sinais vitais, achados do exame..."
            defaultValue={defaults?.exame_fisico ?? ""}
            className={INPUT_CLASS}
          />
          <FieldError message={state.fieldErrors?.exame_fisico} />
        </div>

        <div>
          <label htmlFor="hipotese_diagnostica" className="block text-sm font-medium text-gray-700">
            Hipótese diagnóstica
          </label>
          <textarea
            id="hipotese_diagnostica"
            name="hipotese_diagnostica"
            rows={2}
            maxLength={TEXTO_MAX_LENGTH}
            disabled={isPending}
            placeholder="Diagnóstico provável..."
            defaultValue={defaults?.hipotese_diagnostica ?? ""}
            className={INPUT_CLASS}
          />
          <FieldError message={state.fieldErrors?.hipotese_diagnostica} />
        </div>

        <div>
          <label htmlFor="conduta" className="block text-sm font-medium text-gray-700">
            Conduta
          </label>
          <textarea
            id="conduta"
            name="conduta"
            rows={3}
            maxLength={TEXTO_MAX_LENGTH}
            disabled={isPending}
            placeholder="Plano terapêutico, medicamentos prescritos, orientações..."
            defaultValue={defaults?.conduta ?? ""}
            className={INPUT_CLASS}
          />
        </div>
      </fieldset>

      {/* Observações */}
      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          maxLength={OBSERVACOES_MAX_LENGTH}
          disabled={isPending}
          defaultValue={defaults?.observacoes ?? ""}
          className={INPUT_CLASS}
        />
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
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isEditing ? "Salvar alterações" : "Salvar prontuário"}
        </button>
      </div>
    </form>
  );
}
