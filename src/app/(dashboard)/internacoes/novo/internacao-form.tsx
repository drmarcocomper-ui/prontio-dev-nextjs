"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import { criarInternacao, atualizarInternacao, type InternacaoFormState } from "../actions";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import {
  type InternacaoDefaults,
  INDICACAO_CLINICA_MAX_LENGTH,
  PROCEDIMENTOS_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  CARATER_LABELS,
  TIPO_INTERNACAO_LABELS,
  REGIME_LABELS,
  INDICACAO_ACIDENTE_LABELS,
  CARACTERES_ATENDIMENTO,
  TIPOS_INTERNACAO,
  REGIMES_INTERNACAO,
  INDICACOES_ACIDENTE,
} from "../types";

export function InternacaoForm({
  defaults,
  cancelHref,
}: {
  defaults?: InternacaoDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const getToday = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
  const [today, setToday] = useState(getToday);

  useEffect(() => {
    const interval = setInterval(() => setToday(getToday()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const action = isEditing ? atualizarInternacao : criarInternacao;

  const [state, formAction, isPending] = useActionState<InternacaoFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/internacoes/${defaults?.id}` : "/pacientes");

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

      {/* Hospital */}
      <div>
        <label htmlFor="hospital_nome" className="block text-sm font-medium text-gray-700">
          Nome do hospital
        </label>
        <input
          id="hospital_nome"
          name="hospital_nome"
          type="text"
          disabled={isPending}
          defaultValue={defaults?.hospital_nome ?? ""}
          placeholder="Hospital onde será realizada a internação"
          className={INPUT_CLASS}
          {...ariaProps("hospital_nome", state.fieldErrors?.hospital_nome)}
        />
        <FieldError id="hospital_nome-error" message={state.fieldErrors?.hospital_nome} />
      </div>

      {/* Data sugerida para internação */}
      <div>
        <label htmlFor="data_sugerida_internacao" className="block text-sm font-medium text-gray-700">
          Data sugerida para internação
        </label>
        <input
          id="data_sugerida_internacao"
          name="data_sugerida_internacao"
          type="date"
          disabled={isPending}
          defaultValue={defaults?.data_sugerida_internacao ?? ""}
          className={INPUT_CLASS}
          {...ariaProps("data_sugerida_internacao", state.fieldErrors?.data_sugerida_internacao)}
        />
        <FieldError id="data_sugerida_internacao-error" message={state.fieldErrors?.data_sugerida_internacao} />
      </div>

      {/* Caráter + Tipo + Regime */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="carater_atendimento" className="block text-sm font-medium text-gray-700">
            Caráter do atendimento
          </label>
          <select
            id="carater_atendimento"
            name="carater_atendimento"
            disabled={isPending}
            defaultValue={defaults?.carater_atendimento ?? ""}
            className={INPUT_CLASS}
            {...ariaProps("carater_atendimento", state.fieldErrors?.carater_atendimento)}
          >
            <option value="">Selecione...</option>
            {CARACTERES_ATENDIMENTO.map((v) => (
              <option key={v} value={v}>{CARATER_LABELS[v]}</option>
            ))}
          </select>
          <FieldError id="carater_atendimento-error" message={state.fieldErrors?.carater_atendimento} />
        </div>

        <div>
          <label htmlFor="tipo_internacao" className="block text-sm font-medium text-gray-700">
            Tipo de internação
          </label>
          <select
            id="tipo_internacao"
            name="tipo_internacao"
            disabled={isPending}
            defaultValue={defaults?.tipo_internacao ?? ""}
            className={INPUT_CLASS}
            {...ariaProps("tipo_internacao", state.fieldErrors?.tipo_internacao)}
          >
            <option value="">Selecione...</option>
            {TIPOS_INTERNACAO.map((v) => (
              <option key={v} value={v}>{TIPO_INTERNACAO_LABELS[v]}</option>
            ))}
          </select>
          <FieldError id="tipo_internacao-error" message={state.fieldErrors?.tipo_internacao} />
        </div>

        <div>
          <label htmlFor="regime_internacao" className="block text-sm font-medium text-gray-700">
            Regime de internação
          </label>
          <select
            id="regime_internacao"
            name="regime_internacao"
            disabled={isPending}
            defaultValue={defaults?.regime_internacao ?? ""}
            className={INPUT_CLASS}
            {...ariaProps("regime_internacao", state.fieldErrors?.regime_internacao)}
          >
            <option value="">Selecione...</option>
            {REGIMES_INTERNACAO.map((v) => (
              <option key={v} value={v}>{REGIME_LABELS[v]}</option>
            ))}
          </select>
          <FieldError id="regime_internacao-error" message={state.fieldErrors?.regime_internacao} />
        </div>
      </div>

      {/* Diárias + OPME + Quimio */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="diarias_solicitadas" className="block text-sm font-medium text-gray-700">
            Diárias solicitadas
          </label>
          <input
            id="diarias_solicitadas"
            name="diarias_solicitadas"
            type="number"
            min={1}
            disabled={isPending}
            defaultValue={defaults?.diarias_solicitadas ?? ""}
            className={INPUT_CLASS}
            {...ariaProps("diarias_solicitadas", state.fieldErrors?.diarias_solicitadas)}
          />
          <FieldError id="diarias_solicitadas-error" message={state.fieldErrors?.diarias_solicitadas} />
        </div>

        <div>
          <label htmlFor="previsao_opme" className="block text-sm font-medium text-gray-700">
            Previsão de uso de OPME
          </label>
          <select
            id="previsao_opme"
            name="previsao_opme"
            disabled={isPending}
            defaultValue={defaults?.previsao_opme ? "sim" : "nao"}
            className={INPUT_CLASS}
          >
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>

        <div>
          <label htmlFor="previsao_quimioterapico" className="block text-sm font-medium text-gray-700">
            Previsão de quimioterápico
          </label>
          <select
            id="previsao_quimioterapico"
            name="previsao_quimioterapico"
            disabled={isPending}
            defaultValue={defaults?.previsao_quimioterapico ? "sim" : "nao"}
            className={INPUT_CLASS}
          >
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>
      </div>

      {/* Indicação clínica */}
      <div>
        <label htmlFor="indicacao_clinica" className="block text-sm font-medium text-gray-700">
          Indicação clínica <span className="text-red-500">*</span>
        </label>
        <textarea
          id="indicacao_clinica"
          name="indicacao_clinica"
          rows={6}
          required
          disabled={isPending}
          maxLength={INDICACAO_CLINICA_MAX_LENGTH}
          placeholder="Descrição da indicação clínica para internação..."
          defaultValue={defaults?.indicacao_clinica ?? ""}
          className={INPUT_CLASS}
          {...ariaProps("indicacao_clinica", state.fieldErrors?.indicacao_clinica)}
        />
        <FieldError id="indicacao_clinica-error" message={state.fieldErrors?.indicacao_clinica} />
      </div>

      {/* CIDs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="cid_principal" className="block text-sm font-medium text-gray-700">
            CID Principal
          </label>
          <input
            id="cid_principal"
            name="cid_principal"
            type="text"
            disabled={isPending}
            defaultValue={defaults?.cid_principal ?? ""}
            placeholder="Ex: J18.9"
            className={INPUT_CLASS}
            {...ariaProps("cid_principal", state.fieldErrors?.cid_principal)}
          />
          <FieldError id="cid_principal-error" message={state.fieldErrors?.cid_principal} />
        </div>

        <div>
          <label htmlFor="cid_2" className="block text-sm font-medium text-gray-700">
            CID 2
          </label>
          <input
            id="cid_2"
            name="cid_2"
            type="text"
            disabled={isPending}
            defaultValue={defaults?.cid_2 ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="cid_3" className="block text-sm font-medium text-gray-700">
            CID 3
          </label>
          <input
            id="cid_3"
            name="cid_3"
            type="text"
            disabled={isPending}
            defaultValue={defaults?.cid_3 ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="cid_4" className="block text-sm font-medium text-gray-700">
            CID 4
          </label>
          <input
            id="cid_4"
            name="cid_4"
            type="text"
            disabled={isPending}
            defaultValue={defaults?.cid_4 ?? ""}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Indicação de acidente */}
      <div>
        <label htmlFor="indicacao_acidente" className="block text-sm font-medium text-gray-700">
          Indicação de acidente
        </label>
        <select
          id="indicacao_acidente"
          name="indicacao_acidente"
          disabled={isPending}
          defaultValue={defaults?.indicacao_acidente ?? ""}
          className={INPUT_CLASS}
          {...ariaProps("indicacao_acidente", state.fieldErrors?.indicacao_acidente)}
        >
          <option value="">Selecione...</option>
          {INDICACOES_ACIDENTE.map((v) => (
            <option key={v} value={v}>{INDICACAO_ACIDENTE_LABELS[v]}</option>
          ))}
        </select>
        <FieldError id="indicacao_acidente-error" message={state.fieldErrors?.indicacao_acidente} />
      </div>

      {/* Procedimentos */}
      <div>
        <label htmlFor="procedimentos" className="block text-sm font-medium text-gray-700">
          Procedimentos
        </label>
        <textarea
          id="procedimentos"
          name="procedimentos"
          rows={6}
          disabled={isPending}
          maxLength={PROCEDIMENTOS_MAX_LENGTH}
          placeholder="Lista de procedimentos solicitados..."
          defaultValue={defaults?.procedimentos ?? ""}
          className={INPUT_CLASS}
          {...ariaProps("procedimentos", state.fieldErrors?.procedimentos)}
        />
        <FieldError id="procedimentos-error" message={state.fieldErrors?.procedimentos} />
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
          {isEditing ? "Salvar alterações" : "Salvar internação"}
        </button>
      </div>
    </form>
  );
}
