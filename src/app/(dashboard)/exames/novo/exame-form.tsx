"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS } from "@/components/form-utils";
import { criarExame, atualizarExame, type ExameFormState } from "../actions";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import { ExameSearch } from "./exame-search";
import {
  type ExameDefaults,
  EXAMES_MAX_LENGTH,
  INDICACAO_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
} from "../types";

export function ExameForm({
  medicoId,
  defaults,
  cancelHref,
}: {
  medicoId: string;
  defaults?: ExameDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const getToday = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
  const [today, setToday] = useState(getToday);

  useEffect(() => {
    const interval = setInterval(() => setToday(getToday()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const action = isEditing ? atualizarExame : criarExame;

  const [state, formAction, isPending] = useActionState<ExameFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/exames/${defaults?.id}` : "/pacientes");
  const examesRef = useRef<HTMLTextAreaElement>(null);

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
          <FieldError message={state.fieldErrors?.paciente_id} />
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
          />
          <FieldError message={state.fieldErrors?.data} />
        </div>
      </div>

      {/* Exames */}
      <div>
        <label htmlFor="exames" className="block text-sm font-medium text-gray-700">
          Exames solicitados <span className="text-red-500">*</span>
        </label>

        <div className="mt-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">Buscar no catálogo</label>
          <ExameSearch
            onSelect={(exame) => {
              if (!examesRef.current) return;
              const entry = exame.codigo_tuss
                ? `- ${exame.nome} (TUSS: ${exame.codigo_tuss})`
                : `- ${exame.nome}`;
              const current = examesRef.current.value.trim();
              examesRef.current.value = current ? `${current}\n${entry}` : entry;
              examesRef.current.focus();
            }}
          />
        </div>

        <textarea
          ref={examesRef}
          id="exames"
          name="exames"
          rows={8}
          required
          disabled={isPending}
          maxLength={EXAMES_MAX_LENGTH}
          placeholder="Liste os exames solicitados..."
          defaultValue={defaults?.exames ?? ""}
          className={`${INPUT_CLASS} mt-1`}
        />
        <FieldError message={state.fieldErrors?.exames} />
      </div>

      {/* Indicação clínica */}
      <div>
        <label htmlFor="indicacao_clinica" className="block text-sm font-medium text-gray-700">
          Indicação clínica / Hipótese diagnóstica
        </label>
        <textarea
          id="indicacao_clinica"
          name="indicacao_clinica"
          rows={3}
          disabled={isPending}
          maxLength={INDICACAO_MAX_LENGTH}
          defaultValue={defaults?.indicacao_clinica ?? ""}
          placeholder="Indicação clínica ou hipótese diagnóstica..."
          className={INPUT_CLASS}
        />
        <FieldError message={state.fieldErrors?.indicacao_clinica} />
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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50 w-full sm:w-auto"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isEditing ? "Salvar alterações" : "Salvar solicitação"}
        </button>
      </div>
    </form>
  );
}
