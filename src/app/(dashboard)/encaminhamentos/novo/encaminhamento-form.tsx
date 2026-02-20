"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import { criarEncaminhamento, atualizarEncaminhamento, type EncaminhamentoFormState } from "../actions";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import { ProfissionalSearch } from "./profissional-search";
import {
  type EncaminhamentoDefaults,
  MOTIVO_MAX_LENGTH,
  PROFISSIONAL_DESTINO_MAX_LENGTH,
  ESPECIALIDADE_MAX_LENGTH,
  TELEFONE_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
} from "../types";

export function EncaminhamentoForm({
  defaults,
  cancelHref,
}: {
  defaults?: EncaminhamentoDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const getToday = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
  const [today, setToday] = useState(getToday);

  const [profissionalDestino, setProfissionalDestino] = useState(defaults?.profissional_destino ?? "");
  const [especialidade, setEspecialidade] = useState(defaults?.especialidade ?? "");
  const [telefoneProfissional, setTelefoneProfissional] = useState(defaults?.telefone_profissional ?? "");

  useEffect(() => {
    const interval = setInterval(() => setToday(getToday), 60_000);
    return () => clearInterval(interval);
  }, []);

  const action = isEditing ? atualizarEncaminhamento : criarEncaminhamento;

  const [state, formAction, isPending] = useActionState<EncaminhamentoFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/encaminhamentos/${defaults?.id}` : "/pacientes");

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

      {/* Profissional destino e Especialidade */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profissional_destino" className="block text-sm font-medium text-gray-700">
            Profissional de destino <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <ProfissionalSearch
              defaultValue={defaults?.profissional_destino ?? ""}
              onSelect={(p) => {
                setProfissionalDestino(p.profissional_destino);
                setEspecialidade(p.especialidade);
                setTelefoneProfissional(p.telefone_profissional ?? "");
              }}
            />
          </div>
          <input type="hidden" name="profissional_destino" value={profissionalDestino} />
          <FieldError id="profissional_destino-error" message={state.fieldErrors?.profissional_destino} />
          <p className="mt-1 text-xs text-gray-400">
            Ou preencha manualmente abaixo
          </p>
        </div>

        <div>
          <label htmlFor="especialidade" className="block text-sm font-medium text-gray-700">
            Especialidade <span className="text-red-500">*</span>
          </label>
          <input
            id="especialidade"
            name="especialidade_display"
            type="text"
            disabled={isPending}
            maxLength={ESPECIALIDADE_MAX_LENGTH}
            placeholder="Ex: Cardiologia"
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
            className={INPUT_CLASS}
            {...ariaProps("especialidade", state.fieldErrors?.especialidade)}
          />
          <input type="hidden" name="especialidade" value={especialidade} />
          <FieldError id="especialidade-error" message={state.fieldErrors?.especialidade} />
        </div>
      </div>

      {/* Profissional destino manual + Telefone */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profissional_destino_manual" className="block text-sm font-medium text-gray-700">
            Nome do profissional
          </label>
          <input
            id="profissional_destino_manual"
            type="text"
            disabled={isPending}
            maxLength={PROFISSIONAL_DESTINO_MAX_LENGTH}
            placeholder="Dr(a). Nome Completo"
            value={profissionalDestino}
            onChange={(e) => setProfissionalDestino(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="telefone_profissional" className="block text-sm font-medium text-gray-700">
            Telefone do profissional
          </label>
          <input
            id="telefone_profissional"
            name="telefone_profissional_display"
            type="text"
            disabled={isPending}
            maxLength={TELEFONE_MAX_LENGTH}
            placeholder="(00) 00000-0000"
            value={telefoneProfissional}
            onChange={(e) => setTelefoneProfissional(e.target.value)}
            className={INPUT_CLASS}
            {...ariaProps("telefone_profissional", state.fieldErrors?.telefone_profissional)}
          />
          <input type="hidden" name="telefone_profissional" value={telefoneProfissional} />
          <FieldError id="telefone_profissional-error" message={state.fieldErrors?.telefone_profissional} />
        </div>
      </div>

      {/* Motivo */}
      <div>
        <label htmlFor="motivo" className="block text-sm font-medium text-gray-700">
          Motivo do encaminhamento <span className="text-red-500">*</span>
        </label>
        <textarea
          id="motivo"
          name="motivo"
          rows={6}
          required
          disabled={isPending}
          maxLength={MOTIVO_MAX_LENGTH}
          placeholder="Descreva o motivo do encaminhamento..."
          defaultValue={defaults?.motivo ?? ""}
          className={INPUT_CLASS}
          {...ariaProps("motivo", state.fieldErrors?.motivo)}
        />
        <FieldError id="motivo-error" message={state.fieldErrors?.motivo} />
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
          {isEditing ? "Salvar alterações" : "Salvar encaminhamento"}
        </button>
      </div>
    </form>
  );
}
