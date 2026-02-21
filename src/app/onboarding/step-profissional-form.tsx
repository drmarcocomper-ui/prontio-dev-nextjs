"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarProfissionalOnboarding, type OnboardingFormState } from "./actions";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import {
  NOME_PROFISSIONAL_MAX,
  ESPECIALIDADE_MAX,
  CRM_MAX,
  RQE_MAX,
} from "@/app/(dashboard)/configuracoes/constants";

export function StepProfissionalForm() {
  const [state, formAction, isPending] = useActionState<OnboardingFormState, FormData>(
    salvarProfissionalOnboarding,
    {}
  );

  return (
    <form action={formAction} className="space-y-4" aria-busy={isPending}>
      <FormError message={state.error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome_profissional" className="block text-sm font-medium text-gray-700">
            Nome do profissional
          </label>
          <input
            id="nome_profissional"
            name="nome_profissional"
            type="text"
            disabled={isPending}
            maxLength={NOME_PROFISSIONAL_MAX}
            className={INPUT_CLASS}
            placeholder="Dr(a). Nome Completo"
            {...ariaProps("nome_profissional", state.fieldErrors?.nome_profissional)}
          />
          <FieldError id="nome_profissional-error" message={state.fieldErrors?.nome_profissional} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="especialidade" className="block text-sm font-medium text-gray-700">
            Especialidade
          </label>
          <input
            id="especialidade"
            name="especialidade"
            type="text"
            disabled={isPending}
            maxLength={ESPECIALIDADE_MAX}
            className={INPUT_CLASS}
            placeholder="Ex: Cardiologia"
            {...ariaProps("especialidade", state.fieldErrors?.especialidade)}
          />
          <FieldError id="especialidade-error" message={state.fieldErrors?.especialidade} />
        </div>

        <div>
          <label htmlFor="crm" className="block text-sm font-medium text-gray-700">
            CRM
          </label>
          <input
            id="crm"
            name="crm"
            type="text"
            disabled={isPending}
            maxLength={CRM_MAX}
            className={INPUT_CLASS}
            placeholder="CRM/UF 000000"
            {...ariaProps("crm", state.fieldErrors?.crm)}
          />
          <FieldError id="crm-error" message={state.fieldErrors?.crm} />
        </div>

        <div>
          <label htmlFor="rqe" className="block text-sm font-medium text-gray-700">
            RQE
          </label>
          <input
            id="rqe"
            name="rqe"
            type="text"
            disabled={isPending}
            maxLength={RQE_MAX}
            className={INPUT_CLASS}
            placeholder="Opcional"
            {...ariaProps("rqe", state.fieldErrors?.rqe)}
          />
          <FieldError id="rqe-error" message={state.fieldErrors?.rqe} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Link
          href="/onboarding?step=3"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Pular
        </Link>
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
