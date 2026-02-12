"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { salvarConfiguracoes, type ConfigFormState } from "./actions";
import {
  INPUT_CLASS,
  NOME_CONSULTORIO_MAX,
  CNPJ_MAX,
  TELEFONE_MAX,
  ENDERECO_MAX,
  CIDADE_MAX,
  ESTADO_MAX,
  maskCNPJ,
  maskPhone,
} from "./constants";

export function ConsultorioForm({
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
    <form action={formAction} className="space-y-6" aria-busy={isPending}>
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
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
            disabled={isPending}
            maxLength={NOME_CONSULTORIO_MAX}
            defaultValue={defaults.nome_consultorio ?? ""}
            className={INPUT_CLASS}
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
            disabled={isPending}
            maxLength={CNPJ_MAX}
            placeholder="00.000.000/0000-00"
            defaultValue={defaults.cnpj ? maskCNPJ(defaults.cnpj) : ""}
            onChange={(e) => (e.target.value = maskCNPJ(e.target.value))}
            className={INPUT_CLASS}
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
            disabled={isPending}
            maxLength={TELEFONE_MAX}
            placeholder="(00) 00000-0000"
            defaultValue={defaults.telefone_consultorio ? maskPhone(defaults.telefone_consultorio) : ""}
            onChange={(e) => (e.target.value = maskPhone(e.target.value))}
            className={INPUT_CLASS}
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
            disabled={isPending}
            maxLength={ENDERECO_MAX}
            defaultValue={defaults.endereco_consultorio ?? ""}
            className={INPUT_CLASS}
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
            disabled={isPending}
            maxLength={CIDADE_MAX}
            defaultValue={defaults.cidade_consultorio ?? ""}
            className={INPUT_CLASS}
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
            disabled={isPending}
            maxLength={ESTADO_MAX}
            placeholder="UF"
            defaultValue={defaults.estado_consultorio ?? ""}
            className={INPUT_CLASS}
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
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}
