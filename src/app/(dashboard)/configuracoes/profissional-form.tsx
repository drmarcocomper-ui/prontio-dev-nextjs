"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { salvarConfiguracoes, type ConfigFormState } from "./actions";
import {
  INPUT_CLASS,
  NOME_PROFISSIONAL_MAX,
  ESPECIALIDADE_MAX,
  CRM_MAX,
  RQE_MAX,
  EMAIL_MAX,
} from "./constants";

export function ProfissionalForm({
  defaults,
}: {
  defaults: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    salvarConfiguracoes,
    {}
  );

  useEffect(() => {
    if (state.success) toast.success("Configurações salvas com sucesso.");
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 sm:space-y-6" aria-busy={isPending}>
      <FormError message={state.error} />

      {/* Hack: nome_consultorio is required by the action, send it hidden */}
      <input type="hidden" name="config_nome_consultorio" value={defaults.nome_consultorio ?? "Prontio"} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome_profissional" className="block text-sm font-medium text-gray-700">
            Nome completo
          </label>
          <input
            id="nome_profissional"
            name="config_nome_profissional"
            type="text"
            disabled={isPending}
            maxLength={NOME_PROFISSIONAL_MAX}
            defaultValue={defaults.nome_profissional ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="especialidade" className="block text-sm font-medium text-gray-700">
            Especialidade
          </label>
          <input
            id="especialidade"
            name="config_especialidade"
            type="text"
            disabled={isPending}
            maxLength={ESPECIALIDADE_MAX}
            placeholder="Ex: Clínica Geral"
            defaultValue={defaults.especialidade ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="crm" className="block text-sm font-medium text-gray-700">
            CRM
          </label>
          <input
            id="crm"
            name="config_crm"
            type="text"
            disabled={isPending}
            maxLength={CRM_MAX}
            placeholder="CRM/UF 000000"
            defaultValue={defaults.crm ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="rqe" className="block text-sm font-medium text-gray-700">
            RQE
          </label>
          <input
            id="rqe"
            name="config_rqe"
            type="text"
            disabled={isPending}
            maxLength={RQE_MAX}
            defaultValue={defaults.rqe ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="email_profissional" className="block text-sm font-medium text-gray-700">
            E-mail profissional
          </label>
          <input
            id="email_profissional"
            name="config_email_profissional"
            type="email"
            disabled={isPending}
            maxLength={EMAIL_MAX}
            defaultValue={defaults.email_profissional ?? ""}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-4 sm:pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}
