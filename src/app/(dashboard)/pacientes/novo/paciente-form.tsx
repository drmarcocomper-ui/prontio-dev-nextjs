"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import { useFormDraft } from "@/hooks/use-form-draft";
import {
  criarPaciente,
  atualizarPaciente,
  type PacienteFormState,
} from "../actions";
import {
  type PacienteDefaults,
  ESTADOS_UF,
  SEXO_LABELS,
  ESTADO_CIVIL_LABELS,
  NOME_MAX_LENGTH, RG_MAX_LENGTH, EMAIL_MAX_LENGTH,
  ENDERECO_MAX_LENGTH, NUMERO_MAX_LENGTH, COMPLEMENTO_MAX_LENGTH,
  BAIRRO_MAX_LENGTH, CIDADE_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH, CONVENIO_LABELS,
  maskCPF, maskPhone, maskCEP,
} from "../types";

export function PacienteForm({
  defaults,
}: {
  defaults?: PacienteDefaults;
}) {
  const isEditing = !!defaults?.id;
  const action = isEditing ? atualizarPaciente : criarPaciente;
  const cancelHref = isEditing ? `/pacientes/${defaults.id}` : "/pacientes";
  const today = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();

  const [state, formAction, isPending] = useActionState<PacienteFormState, FormData>(
    action,
    {}
  );

  const formRef = useRef<HTMLFormElement>(null);
  const draftId = isEditing ? `paciente-edit-${defaults?.id}` : "paciente-novo";
  const { restoreDraft, hasDraft, clearDraft } = useFormDraft(draftId, formRef);
  const [showDraftBanner, setShowDraftBanner] = useState(() => !isEditing && hasDraft());

  function handleRestore() {
    restoreDraft();
    setShowDraftBanner(false);
  }

  function handleDiscard() {
    clearDraft();
    setShowDraftBanner(false);
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-8" aria-busy={isPending}>
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      {showDraftBanner && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>Existe um rascunho salvo. Deseja restaurá-lo?</span>
          <div className="flex gap-2">
            <button type="button" onClick={handleRestore} className="font-semibold text-amber-700 hover:text-amber-900">
              Restaurar
            </button>
            <button type="button" onClick={handleDiscard} className="text-amber-600 hover:text-amber-800">
              Descartar
            </button>
          </div>
        </div>
      )}

      <FormError message={state.error} />

      {/* Dados pessoais */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">
          Dados pessoais
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              disabled={isPending}
              maxLength={NOME_MAX_LENGTH}
              defaultValue={defaults?.nome ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("nome", state.fieldErrors?.nome)}
            />
            <FieldError id="nome-error" message={state.fieldErrors?.nome} />
          </div>

          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
              CPF
            </label>
            <input
              id="cpf"
              name="cpf"
              type="text"
              inputMode="numeric"
              maxLength={14}
              disabled={isPending}
              placeholder="000.000.000-00"
              defaultValue={defaults?.cpf ? maskCPF(defaults.cpf) : ""}
              onChange={(e) => (e.target.value = maskCPF(e.target.value))}
              className={INPUT_CLASS}
              {...ariaProps("cpf", state.fieldErrors?.cpf)}
            />
            <FieldError id="cpf-error" message={state.fieldErrors?.cpf} />
          </div>

          <div>
            <label htmlFor="rg" className="block text-sm font-medium text-gray-700">
              RG
            </label>
            <input
              id="rg"
              name="rg"
              type="text"
              disabled={isPending}
              maxLength={RG_MAX_LENGTH}
              defaultValue={defaults?.rg ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("rg", state.fieldErrors?.rg)}
            />
            <FieldError id="rg-error" message={state.fieldErrors?.rg} />
          </div>

          <div>
            <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700">
              Data de nascimento
            </label>
            <input
              id="data_nascimento"
              name="data_nascimento"
              type="date"
              disabled={isPending}
              max={today}
              defaultValue={defaults?.data_nascimento ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("data_nascimento", state.fieldErrors?.data_nascimento)}
            />
            <FieldError id="data_nascimento-error" message={state.fieldErrors?.data_nascimento} />
          </div>

          <div>
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">
              Sexo
            </label>
            <select
              id="sexo"
              name="sexo"
              disabled={isPending}
              defaultValue={defaults?.sexo ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("sexo", state.fieldErrors?.sexo)}
            >
              <option value="">Selecione</option>
              {Object.entries(SEXO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError id="sexo-error" message={state.fieldErrors?.sexo} />
          </div>

          <div>
            <label htmlFor="estado_civil" className="block text-sm font-medium text-gray-700">
              Estado civil
            </label>
            <select
              id="estado_civil"
              name="estado_civil"
              disabled={isPending}
              defaultValue={defaults?.estado_civil ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("estado_civil", state.fieldErrors?.estado_civil)}
            >
              <option value="">Selecione</option>
              {Object.entries(ESTADO_CIVIL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError id="estado_civil-error" message={state.fieldErrors?.estado_civil} />
          </div>
        </div>
      </fieldset>

      {/* Contato */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">Contato</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              inputMode="numeric"
              disabled={isPending}
              placeholder="(00) 00000-0000"
              defaultValue={defaults?.telefone ? maskPhone(defaults.telefone) : ""}
              onChange={(e) => (e.target.value = maskPhone(e.target.value))}
              className={INPUT_CLASS}
              {...ariaProps("telefone", state.fieldErrors?.telefone)}
            />
            <FieldError id="telefone-error" message={state.fieldErrors?.telefone} />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled={isPending}
              maxLength={EMAIL_MAX_LENGTH}
              placeholder="paciente@email.com"
              defaultValue={defaults?.email ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("email", state.fieldErrors?.email)}
            />
            <FieldError id="email-error" message={state.fieldErrors?.email} />
          </div>
        </div>
      </fieldset>

      {/* Endereço */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">Endereço</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label htmlFor="cep" className="block text-sm font-medium text-gray-700">
              CEP
            </label>
            <input
              id="cep"
              name="cep"
              type="text"
              inputMode="numeric"
              disabled={isPending}
              placeholder="00000-000"
              defaultValue={defaults?.cep ? maskCEP(defaults.cep) : ""}
              onChange={(e) => (e.target.value = maskCEP(e.target.value))}
              className={INPUT_CLASS}
              {...ariaProps("cep", state.fieldErrors?.cep)}
            />
            <FieldError id="cep-error" message={state.fieldErrors?.cep} />
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">
              Rua / Avenida
            </label>
            <input
              id="endereco"
              name="endereco"
              type="text"
              disabled={isPending}
              maxLength={ENDERECO_MAX_LENGTH}
              defaultValue={defaults?.endereco ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("endereco", state.fieldErrors?.endereco)}
            />
            <FieldError id="endereco-error" message={state.fieldErrors?.endereco} />
          </div>

          <div className="sm:col-span-1">
            <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
              Número
            </label>
            <input
              id="numero"
              name="numero"
              type="text"
              disabled={isPending}
              maxLength={NUMERO_MAX_LENGTH}
              defaultValue={defaults?.numero ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("numero", state.fieldErrors?.numero)}
            />
            <FieldError id="numero-error" message={state.fieldErrors?.numero} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">
              Complemento
            </label>
            <input
              id="complemento"
              name="complemento"
              type="text"
              disabled={isPending}
              maxLength={COMPLEMENTO_MAX_LENGTH}
              defaultValue={defaults?.complemento ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("complemento", state.fieldErrors?.complemento)}
            />
            <FieldError id="complemento-error" message={state.fieldErrors?.complemento} />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">
              Bairro
            </label>
            <input
              id="bairro"
              name="bairro"
              type="text"
              disabled={isPending}
              maxLength={BAIRRO_MAX_LENGTH}
              defaultValue={defaults?.bairro ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("bairro", state.fieldErrors?.bairro)}
            />
            <FieldError id="bairro-error" message={state.fieldErrors?.bairro} />
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">
              Cidade
            </label>
            <input
              id="cidade"
              name="cidade"
              type="text"
              disabled={isPending}
              maxLength={CIDADE_MAX_LENGTH}
              defaultValue={defaults?.cidade ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("cidade", state.fieldErrors?.cidade)}
            />
            <FieldError id="cidade-error" message={state.fieldErrors?.cidade} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              disabled={isPending}
              defaultValue={defaults?.estado ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("estado", state.fieldErrors?.estado)}
            >
              <option value="">UF</option>
              {ESTADOS_UF.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
            <FieldError id="estado-error" message={state.fieldErrors?.estado} />
          </div>
        </div>
      </fieldset>

      {/* Informações adicionais */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">
          Informações adicionais
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="convenio" className="block text-sm font-medium text-gray-700">
              Convênio
            </label>
            <select
              id="convenio"
              name="convenio"
              disabled={isPending}
              defaultValue={defaults?.convenio ?? ""}
              className={INPUT_CLASS}
              {...ariaProps("convenio", state.fieldErrors?.convenio)}
            >
              <option value="">Selecione</option>
              {Object.entries(CONVENIO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError id="convenio-error" message={state.fieldErrors?.convenio} />
          </div>
        </div>

        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            disabled={isPending}
            maxLength={OBSERVACOES_MAX_LENGTH}
            defaultValue={defaults?.observacoes ?? ""}
            className={INPUT_CLASS}
            {...ariaProps("observacoes", state.fieldErrors?.observacoes)}
          />
          <FieldError id="observacoes-error" message={state.fieldErrors?.observacoes} />
        </div>
      </fieldset>

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
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isEditing ? "Salvar alterações" : "Cadastrar paciente"}
        </button>
      </div>
    </form>
  );
}
