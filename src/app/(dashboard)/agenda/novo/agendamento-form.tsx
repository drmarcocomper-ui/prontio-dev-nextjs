"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarAgendamento, atualizarAgendamento, type AgendamentoFormState } from "../actions";
import { type AgendamentoDefaults, OBSERVACOES_MAX_LENGTH } from "../types";
import { PatientSearch } from "./patient-search";

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function AgendamentoForm({
  defaultDate,
  defaults,
}: {
  defaultDate?: string;
  defaults?: AgendamentoDefaults;
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
    <form action={formAction} className="space-y-6">
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Paciente */}
      <div>
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

      {/* Data e horários */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="data" className="block text-sm font-medium text-gray-700">
            Data <span className="text-red-500">*</span>
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={dateValue}
            className={inputClass}
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
            required
            defaultValue={defaults?.hora_inicio ?? ""}
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.hora_inicio} />
        </div>

        <div>
          <label htmlFor="hora_fim" className="block text-sm font-medium text-gray-700">
            Término <span className="text-red-500">*</span>
          </label>
          <input
            id="hora_fim"
            name="hora_fim"
            type="time"
            required
            defaultValue={defaults?.hora_fim ?? ""}
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.hora_fim} />
        </div>
      </div>

      {/* Tipo */}
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
          defaultValue={defaults?.observacoes ?? ""}
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
        <Link
          href={cancelHref}
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
          {isEditing ? "Salvar alterações" : "Agendar"}
        </button>
      </div>
    </form>
  );
}
