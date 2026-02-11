"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { salvarConfiguracoes, type ConfigFormState } from "./actions";

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

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
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

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
            defaultValue={defaults.nome_profissional ?? ""}
            className={inputClass}
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
            placeholder="Ex: Clínica Geral"
            defaultValue={defaults.especialidade ?? ""}
            className={inputClass}
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
            placeholder="CRM/UF 000000"
            defaultValue={defaults.crm ?? ""}
            className={inputClass}
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
            defaultValue={defaults.rqe ?? ""}
            className={inputClass}
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
            defaultValue={defaults.email_profissional ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          {isPending && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}
