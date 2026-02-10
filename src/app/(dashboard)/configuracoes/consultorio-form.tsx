"use client";

import { useActionState } from "react";
import { salvarConfiguracoes, type ConfigFormState } from "./actions";

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function ConsultorioForm({
  defaults,
}: {
  defaults: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    salvarConfiguracoes,
    {}
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Configurações salvas com sucesso.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome_consultorio" className="block text-sm font-medium text-gray-700">
            Nome do consultório <span className="text-red-500">*</span>
          </label>
          <input
            id="nome_consultorio"
            name="config_nome_consultorio"
            type="text"
            required
            defaultValue={defaults.nome_consultorio ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
            CNPJ
          </label>
          <input
            id="cnpj"
            name="config_cnpj"
            type="text"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            defaultValue={defaults.cnpj ? maskCNPJ(defaults.cnpj) : ""}
            onChange={(e) => (e.target.value = maskCNPJ(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="telefone_consultorio" className="block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            id="telefone_consultorio"
            name="config_telefone_consultorio"
            type="tel"
            inputMode="numeric"
            placeholder="(00) 00000-0000"
            defaultValue={defaults.telefone_consultorio ? maskPhone(defaults.telefone_consultorio) : ""}
            onChange={(e) => (e.target.value = maskPhone(e.target.value))}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="endereco_consultorio" className="block text-sm font-medium text-gray-700">
            Endereço
          </label>
          <input
            id="endereco_consultorio"
            name="config_endereco_consultorio"
            type="text"
            defaultValue={defaults.endereco_consultorio ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="cidade_consultorio" className="block text-sm font-medium text-gray-700">
            Cidade
          </label>
          <input
            id="cidade_consultorio"
            name="config_cidade_consultorio"
            type="text"
            defaultValue={defaults.cidade_consultorio ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="estado_consultorio" className="block text-sm font-medium text-gray-700">
            Estado
          </label>
          <input
            id="estado_consultorio"
            name="config_estado_consultorio"
            type="text"
            maxLength={2}
            placeholder="UF"
            defaultValue={defaults.estado_consultorio ?? ""}
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
