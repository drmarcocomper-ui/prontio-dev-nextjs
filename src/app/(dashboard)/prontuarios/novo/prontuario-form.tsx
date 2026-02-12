"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarProntuario, atualizarProntuario, type ProntuarioFormState } from "../actions";
import { type ProntuarioDefaults, TEXTO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH, CID_MAX_LENGTH } from "../types";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function ProntuarioForm({
  defaults,
  cancelHref,
}: {
  defaults?: ProntuarioDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const today = new Date().toISOString().split("T")[0];

  const action = isEditing ? atualizarProntuario : criarProntuario;

  const [state, formAction, isPending] = useActionState<ProntuarioFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/prontuarios/${defaults?.id}` : "/prontuarios");

  return (
    <form action={formAction} className="space-y-6">
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
            max={today}
            defaultValue={defaults?.data ?? today}
            className={inputClass}
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
          <select id="tipo" name="tipo" defaultValue={defaults?.tipo ?? ""} className={inputClass}>
            <option value="">Selecione</option>
            <option value="consulta">Consulta</option>
            <option value="retorno">Retorno</option>
            <option value="exame">Exame</option>
            <option value="procedimento">Procedimento</option>
            <option value="avaliacao">Avaliação</option>
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
            defaultValue={defaults?.cid ?? ""}
            className={inputClass}
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
            placeholder="Motivo da consulta..."
            defaultValue={defaults?.queixa_principal ?? ""}
            className={inputClass}
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
            placeholder="Evolução dos sintomas, duração, fatores de melhora/piora..."
            defaultValue={defaults?.historia_doenca ?? ""}
            className={inputClass}
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
            placeholder="Sinais vitais, achados do exame..."
            defaultValue={defaults?.exame_fisico ?? ""}
            className={inputClass}
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
            placeholder="Diagnóstico provável..."
            defaultValue={defaults?.hipotese_diagnostica ?? ""}
            className={inputClass}
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
            placeholder="Plano terapêutico, medicamentos prescritos, orientações..."
            defaultValue={defaults?.conduta ?? ""}
            className={inputClass}
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
          defaultValue={defaults?.observacoes ?? ""}
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
        <Link
          href={cancel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50"
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
