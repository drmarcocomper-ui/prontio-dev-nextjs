"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { salvarConsultorio, type ConfigFormState } from "./actions";
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

interface ClinicaData {
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

export function ConsultorioForm({
  clinica,
}: {
  clinica: ClinicaData;
}) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    salvarConsultorio,
    {}
  );

  useEffect(() => {
    if (state.success) toast.success("Configurações salvas com sucesso.");
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 sm:space-y-6" aria-busy={isPending}>
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
            defaultValue={clinica.nome}
            className={INPUT_CLASS}
          />
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
            defaultValue={clinica.cnpj ? maskCNPJ(clinica.cnpj) : ""}
            onChange={(e) => (e.target.value = maskCNPJ(e.target.value))}
            className={INPUT_CLASS}
          />
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
            defaultValue={clinica.telefone ? maskPhone(clinica.telefone) : ""}
            onChange={(e) => (e.target.value = maskPhone(e.target.value))}
            className={INPUT_CLASS}
          />
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
            defaultValue={clinica.endereco ?? ""}
            className={INPUT_CLASS}
          />
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
            defaultValue={clinica.cidade ?? ""}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
            Estado
          </label>
          <input
            id="estado"
            name="estado"
            type="text"
            disabled={isPending}
            maxLength={ESTADO_MAX}
            placeholder="UF"
            defaultValue={clinica.estado ?? ""}
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
