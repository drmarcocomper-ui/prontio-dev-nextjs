"use client";

import { useActionState, useState, useEffect } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { DeleteButton } from "@/components/delete-button";
import {
  criarCatalogoExame,
  atualizarCatalogoExame,
  excluirCatalogoExame,
  type ConfigFormState,
} from "./actions";
import { INPUT_CLASS } from "./constants";

export interface CatalogoExame {
  id: string;
  nome: string;
  codigo_tuss: string | null;
}

function ExameItem({ exame }: { exame: CatalogoExame }) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction, isEditing] = useActionState<ConfigFormState, FormData>(
    atualizarCatalogoExame,
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
    if (editState.success) toast.success("Exame atualizado.");
  }, [editState]);

  if (editing) {
    return (
      <tr className="bg-primary-50/30">
        <td colSpan={3} className="px-3 py-3">
          <form action={editAction} className="space-y-3" aria-busy={isEditing}>
            <input type="hidden" name="id" value={exame.id} />
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
                  defaultValue={exame.nome}
                  className={INPUT_CLASS}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Código TUSS</label>
                <input
                  name="codigo_tuss"
                  type="text"
                  maxLength={50}
                  disabled={isEditing}
                  defaultValue={exame.codigo_tuss ?? ""}
                  className={INPUT_CLASS}
                />
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
      <td className="px-3 py-2.5 text-sm text-gray-900">{exame.nome}</td>
      <td className="px-3 py-2.5 text-sm text-gray-500">{exame.codigo_tuss || "—"}</td>
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
            onDelete={() => excluirCatalogoExame(exame.id)}
            title="Excluir exame"
            description="Tem certeza que deseja excluir este exame?"
            errorMessage="Erro ao excluir exame."
          />
        </div>
      </td>
    </tr>
  );
}

export function CatalogoExamesForm({
  exames,
}: {
  exames: CatalogoExame[];
}) {
  const [busca, setBusca] = useState("");
  const [createState, createAction, isCreating] = useActionState<ConfigFormState, FormData>(
    criarCatalogoExame,
    {}
  );

  useEffect(() => {
    if (createState.success) toast.success("Exame cadastrado.");
  }, [createState]);

  const filtrados = busca
    ? exames.filter((e) =>
        e.nome.toLowerCase().includes(busca.toLowerCase()) ||
        e.codigo_tuss?.toLowerCase().includes(busca.toLowerCase())
      )
    : exames;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar exame..."
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
                <th className="px-3 py-2.5">Código TUSS</th>
                <th className="px-3 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((exame) => (
                <ExameItem key={exame.id} exame={exame} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 py-8">
          {busca ? "Nenhum exame encontrado." : "Nenhum exame cadastrado."}
        </p>
      )}

      {/* Create form */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Novo exame</h3>
        <form action={createAction} className="mt-3 space-y-3" aria-busy={isCreating}>
          <FormError message={createState.error} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="novo_exame_nome" className="block text-xs font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="novo_exame_nome"
                name="nome"
                type="text"
                required
                maxLength={255}
                disabled={isCreating}
                placeholder="Ex: Hemograma completo"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="novo_exame_tuss" className="block text-xs font-medium text-gray-700">
                Código TUSS
              </label>
              <input
                id="novo_exame_tuss"
                name="codigo_tuss"
                type="text"
                maxLength={50}
                disabled={isCreating}
                placeholder="Ex: 40304361"
                className={INPUT_CLASS}
              />
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
        {exames.length} {exames.length === 1 ? "exame cadastrado" : "exames cadastrados"}
      </p>
    </div>
  );
}
