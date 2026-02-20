"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import { criarAtestado, atualizarAtestado, type AtestadoFormState } from "../actions";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import {
  type AtestadoDefaults,
  CONTEUDO_MAX_LENGTH,
  CID_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  TIPO_LABELS,
  TIPOS_ATESTADO,
} from "../types";

export function AtestadoForm({
  medicoId,
  defaults,
  cancelHref,
}: {
  medicoId: string;
  defaults?: AtestadoDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const getToday = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
  const [today, setToday] = useState(getToday);

  useEffect(() => {
    const interval = setInterval(() => setToday(getToday()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const action = isEditing ? atualizarAtestado : criarAtestado;

  const [state, formAction, isPending] = useActionState<AtestadoFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/atestados/${defaults?.id}` : "/pacientes");

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
              medicoId={medicoId}
            />
          </div>
          <FieldError id="paciente_id-error" message={state.fieldErrors?.paciente_id} />
        </div>

        <div>
          <label htmlFor="data" className="block text-sm font-medium text-gray-700">
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            disabled={isPending}
            max={today}
            defaultValue={isEditing ? (defaults?.data ?? "") : (defaults?.data ?? today)}
            className={INPUT_CLASS}
            {...ariaProps("data", state.fieldErrors?.data)}
          />
          <FieldError id="data-error" message={state.fieldErrors?.data} />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo de atestado <span className="text-red-500">*</span>
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          disabled={isPending}
          defaultValue={defaults?.tipo ?? ""}
          className={INPUT_CLASS}
          {...ariaProps("tipo", state.fieldErrors?.tipo)}
        >
          <option value="">Selecione...</option>
          {TIPOS_ATESTADO.map((t) => (
            <option key={t} value={t}>
              {TIPO_LABELS[t]}
            </option>
          ))}
        </select>
        <FieldError id="tipo-error" message={state.fieldErrors?.tipo} />
      </div>

      {/* Conteúdo */}
      <div>
        <label htmlFor="conteudo" className="block text-sm font-medium text-gray-700">
          Conteúdo do atestado <span className="text-red-500">*</span>
        </label>
        <textarea
          id="conteudo"
          name="conteudo"
          rows={8}
          required
          disabled={isPending}
          maxLength={CONTEUDO_MAX_LENGTH}
          placeholder="Texto do atestado..."
          defaultValue={defaults?.conteudo ?? ""}
          className={INPUT_CLASS}
          {...ariaProps("conteudo", state.fieldErrors?.conteudo)}
        />
        <FieldError id="conteudo-error" message={state.fieldErrors?.conteudo} />
      </div>

      {/* CID e Dias de afastamento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cid" className="block text-sm font-medium text-gray-700">
            CID
          </label>
          <input
            id="cid"
            name="cid"
            type="text"
            disabled={isPending}
            maxLength={CID_MAX_LENGTH}
            placeholder="Ex: J06.9"
            defaultValue={defaults?.cid ?? ""}
            className={INPUT_CLASS}
            {...ariaProps("cid", state.fieldErrors?.cid)}
          />
          <FieldError id="cid-error" message={state.fieldErrors?.cid} />
        </div>

        <div>
          <label htmlFor="dias_afastamento" className="block text-sm font-medium text-gray-700">
            Dias de afastamento
          </label>
          <input
            id="dias_afastamento"
            name="dias_afastamento"
            type="number"
            min={1}
            disabled={isPending}
            placeholder="Ex: 3"
            defaultValue={defaults?.dias_afastamento ?? ""}
            className={INPUT_CLASS}
            {...ariaProps("dias_afastamento", state.fieldErrors?.dias_afastamento)}
          />
          <FieldError id="dias_afastamento-error" message={state.fieldErrors?.dias_afastamento} />
        </div>
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
          {...ariaProps("observacoes", state.fieldErrors?.observacoes)}
        />
        <FieldError id="observacoes-error" message={state.fieldErrors?.observacoes} />
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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50 w-full sm:w-auto"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isEditing ? "Salvar alterações" : "Salvar atestado"}
        </button>
      </div>
    </form>
  );
}
