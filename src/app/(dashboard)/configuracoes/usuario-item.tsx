"use client";

import { useActionState, useState, useEffect } from "react";
import { toast } from "sonner";
import { INPUT_CLASS, FormError } from "@/components/form-utils";
import { DeleteButton } from "@/components/delete-button";
import { ConfirmModal } from "@/components/confirm-modal";
import { atualizarPapel, removerVinculo } from "@/app/(dashboard)/usuarios/actions";
import {
  type UsuarioListItem,
  PAPEL_BADGE,
  PAPEL_OPTIONS,
  type UsuarioFormState,
} from "@/app/(dashboard)/usuarios/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function UsuarioItem({
  usuario,
  isSelf,
}: {
  usuario: UsuarioListItem;
  isSelf: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction, isEditing] = useActionState<UsuarioFormState, FormData>(
    atualizarPapel,
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
    if (editState.success) {
      toast.success("Papel atualizado.");
    }
  }, [editState]);

  const badge = PAPEL_BADGE[usuario.papel];

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <form action={editAction} className="space-y-2">
              <input type="hidden" name="vinculo_id" value={usuario.vinculo_id} />
              <input type="hidden" name="user_id" value={usuario.user_id} />
              <FormError message={editState.error} />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {usuario.email || usuario.user_id.slice(0, 8)}
              </p>
              <div className="flex items-center gap-2">
                <select
                  name="papel"
                  defaultValue={usuario.papel}
                  disabled={isEditing}
                  className={INPUT_CLASS}
                  autoFocus
                >
                  {PAPEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isEditing}
                  title="Salvar"
                  className="shrink-0 rounded-lg bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {isEditing ? (
                    <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={isEditing}
                  title="Cancelar"
                  className="shrink-0 rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {usuario.email || usuario.user_id.slice(0, 8)}
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge?.className ?? "bg-gray-50 text-gray-700"}`}
                >
                  {badge?.label ?? usuario.papel}
                </span>
                {isSelf && (
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                    Você
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {usuario.clinica_nome} · {formatDate(usuario.created_at)}
              </p>
            </>
          )}
        </div>

        {/* Action buttons — only for non-self, when not editing */}
        {!editing && !isSelf && (
          <div className="flex shrink-0 items-center gap-1">
            {/* Edit papel */}
            <button
              onClick={() => setEditing(true)}
              title="Editar papel"
              aria-label="Editar papel"
              className="text-gray-400 transition-colors hover:text-primary-600"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </button>

            {/* Delete (remove vínculo) */}
            <DeleteButton
              variant="icon"
              onDelete={() => removerVinculo(usuario.vinculo_id)}
              title="Remover usuário"
              description="Tem certeza que deseja remover este usuário da clínica? Esta ação não pode ser desfeita."
              errorMessage="Erro ao remover usuário."
            />
          </div>
        )}
      </div>
    </div>
  );
}
