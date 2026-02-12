"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  criarPaciente,
  atualizarPaciente,
  type PacienteFormState,
} from "../actions";
import {
  type PacienteDefaults,
  ESTADOS_UF,
  NOME_MAX_LENGTH, RG_MAX_LENGTH, EMAIL_MAX_LENGTH,
  ENDERECO_MAX_LENGTH, NUMERO_MAX_LENGTH, COMPLEMENTO_MAX_LENGTH,
  BAIRRO_MAX_LENGTH, CIDADE_MAX_LENGTH, CONVENIO_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  maskCPF, maskPhone, maskCEP,
} from "../types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

export function PacienteForm({
  defaults,
}: {
  defaults?: PacienteDefaults;
}) {
  const isEditing = !!defaults?.id;
  const action = isEditing ? atualizarPaciente : criarPaciente;
  const cancelHref = isEditing ? `/pacientes/${defaults.id}` : "/pacientes";
  const today = new Date().toISOString().split("T")[0];

  const [state, formAction, isPending] = useActionState<PacienteFormState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="space-y-8">
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

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
              maxLength={NOME_MAX_LENGTH}
              defaultValue={defaults?.nome ?? ""}
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.nome} />
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
              placeholder="000.000.000-00"
              defaultValue={defaults?.cpf ? maskCPF(defaults.cpf) : ""}
              onChange={(e) => (e.target.value = maskCPF(e.target.value))}
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.cpf} />
          </div>

          <div>
            <label htmlFor="rg" className="block text-sm font-medium text-gray-700">
              RG
            </label>
            <input
              id="rg"
              name="rg"
              type="text"
              maxLength={RG_MAX_LENGTH}
              defaultValue={defaults?.rg ?? ""}
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.rg} />
          </div>

          <div>
            <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700">
              Data de nascimento
            </label>
            <input
              id="data_nascimento"
              name="data_nascimento"
              type="date"
              max={today}
              defaultValue={defaults?.data_nascimento ?? ""}
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.data_nascimento} />
          </div>

          <div>
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">
              Sexo
            </label>
            <select
              id="sexo"
              name="sexo"
              defaultValue={defaults?.sexo ?? ""}
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="estado_civil" className="block text-sm font-medium text-gray-700">
              Estado civil
            </label>
            <select
              id="estado_civil"
              name="estado_civil"
              defaultValue={defaults?.estado_civil ?? ""}
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="solteiro">Solteiro(a)</option>
              <option value="casado">Casado(a)</option>
              <option value="divorciado">Divorciado(a)</option>
              <option value="viuvo">Viúvo(a)</option>
              <option value="uniao_estavel">União estável</option>
            </select>
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
              placeholder="(00) 00000-0000"
              defaultValue={defaults?.telefone ? maskPhone(defaults.telefone) : ""}
              onChange={(e) => (e.target.value = maskPhone(e.target.value))}
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.telefone} />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              maxLength={EMAIL_MAX_LENGTH}
              placeholder="paciente@email.com"
              defaultValue={defaults?.email ?? ""}
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.email} />
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
              placeholder="00000-000"
              defaultValue={defaults?.cep ? maskCEP(defaults.cep) : ""}
              onChange={(e) => (e.target.value = maskCEP(e.target.value))}
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.cep} />
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">
              Rua / Avenida
            </label>
            <input
              id="endereco"
              name="endereco"
              type="text"
              maxLength={ENDERECO_MAX_LENGTH}
              defaultValue={defaults?.endereco ?? ""}
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.endereco} />
          </div>

          <div className="sm:col-span-1">
            <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
              Número
            </label>
            <input
              id="numero"
              name="numero"
              type="text"
              maxLength={NUMERO_MAX_LENGTH}
              defaultValue={defaults?.numero ?? ""}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">
              Complemento
            </label>
            <input
              id="complemento"
              name="complemento"
              type="text"
              maxLength={COMPLEMENTO_MAX_LENGTH}
              defaultValue={defaults?.complemento ?? ""}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">
              Bairro
            </label>
            <input
              id="bairro"
              name="bairro"
              type="text"
              maxLength={BAIRRO_MAX_LENGTH}
              defaultValue={defaults?.bairro ?? ""}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">
              Cidade
            </label>
            <input
              id="cidade"
              name="cidade"
              type="text"
              maxLength={CIDADE_MAX_LENGTH}
              defaultValue={defaults?.cidade ?? ""}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={defaults?.estado ?? ""}
              className={inputClass}
            >
              <option value="">UF</option>
              {ESTADOS_UF.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
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
            <input
              id="convenio"
              name="convenio"
              type="text"
              maxLength={CONVENIO_MAX_LENGTH}
              placeholder="Nome do convênio"
              defaultValue={defaults?.convenio ?? ""}
              className={inputClass}
            />
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
            maxLength={OBSERVACOES_MAX_LENGTH}
            defaultValue={defaults?.observacoes ?? ""}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
        <Link
          href={cancelHref}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50"
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
