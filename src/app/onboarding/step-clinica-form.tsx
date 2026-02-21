"use client";

import { useActionState } from "react";
import { criarClinicaOnboarding, type OnboardingFormState } from "./actions";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import {
  NOME_CONSULTORIO_MAX,
  CNPJ_MAX,
  TELEFONE_MAX,
  ENDERECO_MAX,
  CIDADE_MAX,
  maskCNPJ,
  maskPhone,
} from "@/app/(dashboard)/configuracoes/constants";
import { ESTADOS_UF } from "@/app/(dashboard)/pacientes/types";

export function StepClinicaForm() {
  const [state, formAction, isPending] = useActionState<OnboardingFormState, FormData>(
    criarClinicaOnboarding,
    {}
  );

  return (
    <form action={formAction} className="space-y-4" aria-busy={isPending}>
      <FormError message={state.error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            Nome do consultório <span className="text-red-500">*</span>
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            disabled={isPending}
            maxLength={NOME_CONSULTORIO_MAX}
            className={INPUT_CLASS}
            placeholder="Ex: Clínica Saúde & Vida"
            {...ariaProps("nome", state.fieldErrors?.nome)}
          />
          <FieldError id="nome-error" message={state.fieldErrors?.nome} />
        </div>

        <div>
          <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
            CNPJ
          </label>
          <input
            id="cnpj"
            name="cnpj"
            type="text"
            inputMode="numeric"
            disabled={isPending}
            maxLength={CNPJ_MAX}
            placeholder="00.000.000/0000-00"
            onChange={(e) => (e.target.value = maskCNPJ(e.target.value))}
            className={INPUT_CLASS}
            {...ariaProps("cnpj", state.fieldErrors?.cnpj)}
          />
          <FieldError id="cnpj-error" message={state.fieldErrors?.cnpj} />
        </div>

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
            maxLength={TELEFONE_MAX}
            placeholder="(00) 00000-0000"
            onChange={(e) => (e.target.value = maskPhone(e.target.value))}
            className={INPUT_CLASS}
            {...ariaProps("telefone", state.fieldErrors?.telefone)}
          />
          <FieldError id="telefone-error" message={state.fieldErrors?.telefone} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">
            Endereço
          </label>
          <input
            id="endereco"
            name="endereco"
            type="text"
            disabled={isPending}
            maxLength={ENDERECO_MAX}
            className={INPUT_CLASS}
            {...ariaProps("endereco", state.fieldErrors?.endereco)}
          />
          <FieldError id="endereco-error" message={state.fieldErrors?.endereco} />
        </div>

        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">
            Cidade
          </label>
          <input
            id="cidade"
            name="cidade"
            type="text"
            disabled={isPending}
            maxLength={CIDADE_MAX}
            className={INPUT_CLASS}
            {...ariaProps("cidade", state.fieldErrors?.cidade)}
          />
          <FieldError id="cidade-error" message={state.fieldErrors?.cidade} />
        </div>

        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            disabled={isPending}
            className={INPUT_CLASS}
            defaultValue=""
            {...ariaProps("estado", state.fieldErrors?.estado)}
          >
            <option value="">Selecione</option>
            {ESTADOS_UF.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
          <FieldError id="estado-error" message={state.fieldErrors?.estado} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Próximo
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </form>
  );
}
