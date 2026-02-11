"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarReceita, atualizarReceita, type ReceitaFormState } from "../actions";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";

export interface ReceitaDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string;
  tipo?: string | null;
  medicamentos?: string | null;
  observacoes?: string | null;
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

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
            defaultValue={defaults?.data ?? today}
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.data} />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo da receita <span className="text-red-500">*</span>
        </label>
        <select id="tipo" name="tipo" required defaultValue={defaults?.tipo ?? ""} className={inputClass}>
          <option value="">Selecione</option>
          <option value="simples">Simples</option>
          <option value="especial">Especial</option>
          <option value="controle_especial">Controle Especial</option>
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
          placeholder="Liste os medicamentos, dosagens e posologias..."
          defaultValue={defaults?.medicamentos ?? ""}
          className={inputClass}
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
          {isEditing ? "Salvar alterações" : "Salvar receita"}
        </button>
      </div>
    </form>
  );
}
