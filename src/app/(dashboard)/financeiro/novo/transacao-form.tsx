"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { criarTransacao, atualizarTransacao, type TransacaoFormState } from "../actions";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";

export interface TransacaoDefaults {
  id?: string;
  tipo?: string;
  categoria?: string | null;
  descricao?: string;
  valor?: string;
  data?: string;
  paciente_id?: string | null;
  paciente_nome?: string | null;
  forma_pagamento?: string | null;
  status?: string;
  observacoes?: string | null;
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function maskCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const CATEGORIAS_RECEITA = [
  { value: "consulta", label: "Consulta" },
  { value: "retorno", label: "Retorno" },
  { value: "exame", label: "Exame" },
  { value: "procedimento", label: "Procedimento" },
  { value: "outros", label: "Outros" },
];

const CATEGORIAS_DESPESA = [
  { value: "aluguel", label: "Aluguel" },
  { value: "salario", label: "Salário" },
  { value: "material", label: "Material" },
  { value: "equipamento", label: "Equipamento" },
  { value: "imposto", label: "Imposto" },
  { value: "outros", label: "Outros" },
];

export function TransacaoForm({ defaults }: { defaults?: TransacaoDefaults }) {
  const isEditing = !!defaults?.id;
  const today = new Date().toISOString().split("T")[0];
  const [tipo, setTipo] = useState(defaults?.tipo ?? "receita");

  const action = isEditing ? atualizarTransacao : criarTransacao;

  const [state, formAction, isPending] = useActionState<TransacaoFormState, FormData>(
    action,
    {}
  );

  const categorias = tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const cancelHref = isEditing ? `/financeiro/${defaults.id}` : "/financeiro";

  return (
    <form action={formAction} className="space-y-6">
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex gap-3">
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
              tipo === "receita"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value="receita"
              checked={tipo === "receita"}
              onChange={() => setTipo("receita")}
              className="sr-only"
            />
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0-6.75-6.75M12 19.5l6.75-6.75" />
            </svg>
            Receita
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
              tipo === "despesa"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value="despesa"
              checked={tipo === "despesa"}
              onChange={() => setTipo("despesa")}
              className="sr-only"
            />
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75" />
            </svg>
            Despesa
          </label>
        </div>
        <FieldError message={state.fieldErrors?.tipo} />
      </div>

      {/* Descrição e Valor */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
            Descrição <span className="text-red-500">*</span>
          </label>
          <input
            id="descricao"
            name="descricao"
            type="text"
            required
            placeholder="Ex: Consulta particular"
            defaultValue={defaults?.descricao ?? ""}
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.descricao} />
        </div>

        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-gray-700">
            Valor (R$) <span className="text-red-500">*</span>
          </label>
          <input
            id="valor"
            name="valor"
            type="text"
            inputMode="numeric"
            required
            placeholder="0,00"
            defaultValue={defaults?.valor ?? ""}
            onChange={(e) => (e.target.value = maskCurrency(e.target.value))}
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.valor} />
        </div>
      </div>

      {/* Data, Categoria, Forma de Pagamento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="data" className="block text-sm font-medium text-gray-700">
            Data <span className="text-red-500">*</span>
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={defaults?.data ?? today}
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.data} />
        </div>

        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
            Categoria
          </label>
          <select id="categoria" name="categoria" defaultValue={defaults?.categoria ?? ""} className={inputClass}>
            <option value="">Selecione</option>
            {categorias.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="forma_pagamento" className="block text-sm font-medium text-gray-700">
            Forma de pagamento
          </label>
          <select id="forma_pagamento" name="forma_pagamento" defaultValue={defaults?.forma_pagamento ?? ""} className={inputClass}>
            <option value="">Selecione</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="cartao_credito">Cartão de crédito</option>
            <option value="cartao_debito">Cartão de débito</option>
            <option value="boleto">Boleto</option>
            <option value="transferencia">Transferência</option>
            <option value="convenio">Convênio</option>
          </select>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select id="status" name="status" defaultValue={defaults?.status ?? "pago"} className={inputClass}>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      {/* Paciente (opcional, para receitas) */}
      {tipo === "receita" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Paciente <span className="text-xs text-gray-400">(opcional)</span>
          </label>
          <div className="mt-1">
            <PatientSearch
              defaultPatientId={defaults?.paciente_id ?? undefined}
              defaultPatientName={defaults?.paciente_nome ?? undefined}
            />
          </div>
        </div>
      )}

      {/* Observações */}
      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          defaultValue={defaults?.observacoes ?? ""}
          className={inputClass}
        />
      </div>

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
          {isEditing ? "Salvar alterações" : "Registrar"}
        </button>
      </div>
    </form>
  );
}
