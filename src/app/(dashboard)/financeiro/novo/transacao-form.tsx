"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import { criarTransacao, atualizarTransacao, type TransacaoFormState } from "../actions";
import { todayLocal } from "@/lib/date";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import {
  type TransacaoDefaults,
  DESCRICAO_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
  PAGAMENTO_LABELS,
  STATUS_LABELS,
  maskCurrency,
} from "../constants";

export function TransacaoForm({ defaults }: { defaults?: TransacaoDefaults }) {
  const isEditing = !!defaults?.id;
  const today = todayLocal();
  const [tipo, setTipo] = useState(defaults?.tipo ?? "receita");

  const action = isEditing ? atualizarTransacao : criarTransacao;

  const [state, formAction, isPending] = useActionState<TransacaoFormState, FormData>(
    action,
    {}
  );

  const categorias = tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const cancelHref = isEditing ? `/financeiro/${defaults.id}` : "/financeiro";

  return (
    <form action={formAction} className="space-y-6" aria-busy={isPending}>
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      <FormError message={state.error} />

      {/* Tipo */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">
          Tipo <span className="text-red-500">*</span>
        </legend>
        <div className="mt-2 flex gap-3">
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
              tipo === "receita"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value="receita"
              disabled={isPending}
              checked={tipo === "receita"}
              onChange={() => setTipo("receita")}
              className="sr-only"
            />
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0-6.75-6.75M12 19.5l6.75-6.75" />
            </svg>
            Receita
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
              tipo === "despesa"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value="despesa"
              disabled={isPending}
              checked={tipo === "despesa"}
              onChange={() => setTipo("despesa")}
              className="sr-only"
            />
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75" />
            </svg>
            Despesa
          </label>
        </div>
        <FieldError id="tipo-error" message={state.fieldErrors?.tipo} />
      </fieldset>

      {/* Descrição e Valor */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
            Descrição <span className="text-red-500">*</span>
          </label>
          <input
            id="descricao"
            name="descricao"
            type="text"
            required
            disabled={isPending}
            maxLength={DESCRICAO_MAX_LENGTH}
            placeholder="Ex: Consulta particular"
            defaultValue={defaults?.descricao ?? ""}
            className={INPUT_CLASS}
            {...ariaProps("descricao", state.fieldErrors?.descricao)}
          />
          <FieldError id="descricao-error" message={state.fieldErrors?.descricao} />
        </div>

        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-gray-700">
            Valor (R$) <span className="text-red-500">*</span>
          </label>
          <input
            id="valor"
            name="valor"
            type="text"
            inputMode="numeric"
            required
            disabled={isPending}
            placeholder="0,00"
            defaultValue={defaults?.valor ?? ""}
            onChange={(e) => (e.target.value = maskCurrency(e.target.value))}
            className={INPUT_CLASS}
            {...ariaProps("valor", state.fieldErrors?.valor)}
          />
          <FieldError id="valor-error" message={state.fieldErrors?.valor} />
        </div>
      </div>

      {/* Data, Categoria, Forma de Pagamento */}
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
            disabled={isPending}
            defaultValue={defaults?.data ?? today}
            className={INPUT_CLASS}
            {...ariaProps("data", state.fieldErrors?.data)}
          />
          <FieldError id="data-error" message={state.fieldErrors?.data} />
        </div>

        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
            Categoria
          </label>
          <select id="categoria" name="categoria" disabled={isPending} defaultValue={defaults?.categoria ?? ""} className={INPUT_CLASS} {...ariaProps("categoria", state.fieldErrors?.categoria)}>
            <option value="">Selecione</option>
            {categorias.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError id="categoria-error" message={state.fieldErrors?.categoria} />
        </div>

        <div>
          <label htmlFor="forma_pagamento" className="block text-sm font-medium text-gray-700">
            Forma de pagamento
          </label>
          <select id="forma_pagamento" name="forma_pagamento" disabled={isPending} defaultValue={defaults?.forma_pagamento ?? ""} className={INPUT_CLASS} {...ariaProps("forma_pagamento", state.fieldErrors?.forma_pagamento)}>
            <option value="">Selecione</option>
            {Object.entries(PAGAMENTO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <FieldError id="forma_pagamento-error" message={state.fieldErrors?.forma_pagamento} />
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select id="status" name="status" disabled={isPending} defaultValue={defaults?.status ?? "pago"} className={INPUT_CLASS} {...ariaProps("status", state.fieldErrors?.status)}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <FieldError id="status-error" message={state.fieldErrors?.status} />
        </div>
      </div>

      {/* Paciente (opcional, para receitas) */}
      {tipo === "receita" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Paciente <span className="text-xs text-gray-400">(opcional)</span>
          </label>
          <div className="mt-1">
            <PatientSearch
              defaultPatientId={defaults?.paciente_id ?? undefined}
              defaultPatientName={defaults?.paciente_nome ?? undefined}
            />
          </div>
        </div>
      )}

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
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isEditing ? "Salvar alterações" : "Registrar"}
        </button>
      </div>
    </form>
  );
}
