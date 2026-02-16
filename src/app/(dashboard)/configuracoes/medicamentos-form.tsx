"use client";

import { useActionState, useState, useEffect } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { DeleteButton } from "@/components/delete-button";
import {
  criarMedicamento,
  atualizarMedicamento,
  excluirMedicamento,
  type ConfigFormState,
} from "./actions";
import { INPUT_CLASS } from "./constants";

export interface Medicamento {
  id: string;
  nome: string;
  posologia: string | null;
  quantidade: string | null;
  via_administracao: string | null;
}

const VIAS = [
  "Oral",
  "Sublingual",
  "Intravenosa",
  "Endovenosa",
  "Intramuscular",
  "Subcutânea",
  "Intracavernosa",
  "Intravaginal",
  "Tópica",
  "Inalatória",
  "Retal",
  "Nasal",
  "Oftálmica",
  "Otológica",
];

function MedicamentoItem({ med }: { med: Medicamento }) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction, isEditing] = useActionState<ConfigFormState, FormData>(
    atualizarMedicamento,
    {}
  );

  const [prevEditState, setPrevEditState] = useState(editState);
  if (editState !== prevEditState) {
    setPrevEditState(editState);
    if (editState.success) {
      setEditing(false);
    }
  }

  useEffect(() => {
    if (editState.success) toast.success("Medicamento atualizado.");
  }, [editState]);

  if (editing) {
    return (
      <tr className="bg-primary-50/30">
        <td colSpan={5} className="px-3 py-3">
          <form action={editAction} className="space-y-3" aria-busy={isEditing}>
            <input type="hidden" name="id" value={med.id} />
            <FormError message={editState.error} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">Nome *</label>
                <input
                  name="nome"
                  type="text"
                  required
                  maxLength={255}
                  disabled={isEditing}
                  defaultValue={med.nome}
                  className={INPUT_CLASS}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Posologia</label>
                <input
                  name="posologia"
                  type="text"
                  maxLength={500}
                  disabled={isEditing}
                  defaultValue={med.posologia ?? ""}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Quantidade</label>
                <input
                  name="quantidade"
                  type="text"
                  maxLength={100}
                  disabled={isEditing}
                  defaultValue={med.quantidade ?? ""}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Via de Administração</label>
                <select
                  name="via_administracao"
                  disabled={isEditing}
                  defaultValue={med.via_administracao ?? ""}
                  className={INPUT_CLASS}
                >
                  <option value="">Selecione...</option>
                  {VIAS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isEditing}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {isEditing && (
                  <div aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={isEditing}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-3 py-2.5 text-sm text-gray-900">{med.nome}</td>
      <td className="px-3 py-2.5 text-sm text-gray-500">{med.posologia || "—"}</td>
      <td className="px-3 py-2.5 text-sm text-gray-500">{med.quantidade || "—"}</td>
      <td className="px-3 py-2.5 text-sm text-gray-500">{med.via_administracao || "—"}</td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditing(true)}
            title="Editar"
            aria-label="Editar"
            className="text-gray-400 transition-colors hover:text-primary-600"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
          <DeleteButton
            variant="icon"
            onDelete={() => excluirMedicamento(med.id)}
            title="Excluir medicamento"
            description="Tem certeza que deseja excluir este medicamento?"
            errorMessage="Erro ao excluir medicamento."
          />
        </div>
      </td>
    </tr>
  );
}

export function MedicamentosForm({
  medicamentos,
}: {
  medicamentos: Medicamento[];
}) {
  const [busca, setBusca] = useState("");
  const [createState, createAction, isCreating] = useActionState<ConfigFormState, FormData>(
    criarMedicamento,
    {}
  );

  useEffect(() => {
    if (createState.success) toast.success("Medicamento cadastrado.");
  }, [createState]);

  const filtrados = busca
    ? medicamentos.filter((m) =>
        m.nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.via_administracao?.toLowerCase().includes(busca.toLowerCase())
      )
    : medicamentos;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar medicamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {/* Table */}
      {filtrados.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2.5">Nome</th>
                <th className="px-3 py-2.5">Posologia</th>
                <th className="px-3 py-2.5">Quantidade</th>
                <th className="px-3 py-2.5">Via</th>
                <th className="px-3 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((med) => (
                <MedicamentoItem key={med.id} med={med} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 py-8">
          {busca ? "Nenhum medicamento encontrado." : "Nenhum medicamento cadastrado."}
        </p>
      )}

      {/* Create form */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Novo medicamento</h3>
        <form action={createAction} className="mt-3 space-y-3" aria-busy={isCreating}>
          <FormError message={createState.error} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="novo_med_nome" className="block text-xs font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="novo_med_nome"
                name="nome"
                type="text"
                required
                maxLength={255}
                disabled={isCreating}
                placeholder="Ex: Amoxicilina 500mg"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="novo_med_posologia" className="block text-xs font-medium text-gray-700">
                Posologia
              </label>
              <input
                id="novo_med_posologia"
                name="posologia"
                type="text"
                maxLength={500}
                disabled={isCreating}
                placeholder="Ex: 1 comprimido a cada 8h"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="novo_med_quantidade" className="block text-xs font-medium text-gray-700">
                Quantidade
              </label>
              <input
                id="novo_med_quantidade"
                name="quantidade"
                type="text"
                maxLength={100}
                disabled={isCreating}
                placeholder="Ex: 21 comprimidos"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="novo_med_via" className="block text-xs font-medium text-gray-700">
                Via de Administração
              </label>
              <select
                id="novo_med_via"
                name="via_administracao"
                disabled={isCreating}
                className={INPUT_CLASS}
              >
                <option value="">Selecione...</option>
                {VIAS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isCreating && (
              <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Cadastrar
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-400">
        {medicamentos.length} {medicamentos.length === 1 ? "medicamento cadastrado" : "medicamentos cadastrados"}
      </p>
    </div>
  );
}
