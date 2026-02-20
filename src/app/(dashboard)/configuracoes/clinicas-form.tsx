"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { DeleteButton } from "@/components/delete-button";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  criarClinica,
  editarClinica,
  alternarStatusClinica,
  excluirClinica,
  type ConfigFormState,
} from "./actions";
import { INPUT_CLASS, NOME_CONSULTORIO_MAX } from "./constants";

const PAPEL_BADGE: Record<string, { label: string; className: string }> = {
  superadmin: { label: "Superadmin", className: "bg-purple-50 text-purple-700" },
  gestor: { label: "Gestor", className: "bg-indigo-50 text-indigo-700" },
  profissional_saude: { label: "Médico", className: "bg-primary-50 text-primary-700" },
  financeiro: { label: "Financeiro", className: "bg-green-50 text-green-700" },
  secretaria: { label: "Secretária", className: "bg-amber-50 text-amber-700" },
};

interface ClinicaInfo {
  id: string;
  nome: string;
  ativo: boolean;
}

interface UsuarioClinica {
  id: string;
  user_id: string;
  papel: string;
  email?: string;
}

function ClinicaItem({
  clinica,
  vinculos,
}: {
  clinica: ClinicaInfo;
  vinculos: UsuarioClinica[];
}) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction, isEditing] = useActionState<ConfigFormState, FormData>(
    editarClinica,
    {}
  );

  const [toggleOpen, setToggleOpen] = useState(false);
  const [isToggling, startToggle] = useTransition();

  const [prevEditState, setPrevEditState] = useState(editState);
  if (editState !== prevEditState) {
    setPrevEditState(editState);
    if (editState.success) {
      setEditing(false);
    }
  }

  useEffect(() => {
    if (editState.success) {
      toast.success("Clínica atualizada.");
    }
  }, [editState]);

  const clinicaVinculos = vinculos.filter((v) => v.id === clinica.id);

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <form action={editAction} className="space-y-2">
              <input type="hidden" name="clinica_id" value={clinica.id} />
              <FormError message={editState.error} />
              <div className="flex items-center gap-2">
                <input
                  name="nome"
                  type="text"
                  defaultValue={clinica.nome}
                  required
                  maxLength={NOME_CONSULTORIO_MAX}
                  disabled={isEditing}
                  className={INPUT_CLASS}
                  autoFocus
                />
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
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{clinica.nome}</p>
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  clinica.ativo
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {clinica.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          )}

          {clinicaVinculos.length > 0 && (
            <div className="mt-2 space-y-1">
              {clinicaVinculos.map((v) => (
                <div key={v.user_id} className="flex items-center gap-2 text-xs text-gray-500">
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      PAPEL_BADGE[v.papel]?.className ?? "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {PAPEL_BADGE[v.papel]?.label ?? v.papel}
                  </span>
                  <span>{v.email || v.user_id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div className="flex shrink-0 items-center gap-1">
            {/* Edit */}
            <button
              onClick={() => setEditing(true)}
              title="Editar nome"
              aria-label="Editar nome"
              className="text-gray-400 transition-colors hover:text-primary-600"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </button>

            {/* Toggle active/inactive */}
            <button
              onClick={() => {
                if (clinica.ativo) {
                  setToggleOpen(true);
                } else {
                  startToggle(async () => {
                    try {
                      await alternarStatusClinica(clinica.id);
                      toast.success("Clínica reativada.");
                    } catch {
                      toast.error("Erro ao reativar clínica.");
                    }
                  });
                }
              }}
              disabled={isToggling}
              title={clinica.ativo ? "Inativar" : "Reativar"}
              aria-label={clinica.ativo ? "Inativar" : "Reativar"}
              className={`transition-colors disabled:opacity-50 ${
                clinica.ativo
                  ? "text-gray-400 hover:text-amber-500"
                  : "text-gray-400 hover:text-green-600"
              }`}
            >
              {isToggling ? (
                <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              ) : clinica.ativo ? (
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ) : (
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              )}
            </button>

            {/* Delete */}
            <DeleteButton
              variant="icon"
              onDelete={() => excluirClinica(clinica.id)}
              title="Excluir clínica"
              description="Tem certeza que deseja excluir esta clínica? Esta ação não pode ser desfeita."
              errorMessage="Erro ao excluir clínica."
            />
          </div>
        )}
      </div>

      {/* Confirm modal for inactivation */}
      <ConfirmModal
        open={toggleOpen}
        onClose={() => setToggleOpen(false)}
        onConfirm={() =>
          startToggle(async () => {
            try {
              await alternarStatusClinica(clinica.id);
              toast.success("Clínica inativada.");
              setToggleOpen(false);
            } catch {
              toast.error("Erro ao inativar clínica.");
              setToggleOpen(false);
            }
          })
        }
        title="Inativar clínica"
        description="A clínica ficará inativa e não aparecerá nas opções de seleção. Você poderá reativá-la depois."
        confirmLabel="Inativar"
        isPending={isToggling}
      />
    </div>
  );
}

export function ClinicasForm({
  clinicas,
  vinculos,
}: {
  clinicas: ClinicaInfo[];
  vinculos: UsuarioClinica[];
}) {
  const [createState, createAction, isCreating] = useActionState<ConfigFormState, FormData>(
    criarClinica,
    {}
  );

  useEffect(() => {
    if (createState.success) toast.success("Clínica criada com sucesso.");
  }, [createState]);

  return (
    <div className="space-y-8">
      {/* Existing Clinics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Suas clínicas</h3>
        <div className="mt-3 space-y-2">
          {clinicas.map((c) => (
            <ClinicaItem key={c.id} clinica={c} vinculos={vinculos} />
          ))}
        </div>
      </div>

      {/* Create New Clinic */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Nova clínica</h3>
        <form action={createAction} className="mt-3 space-y-3" aria-busy={isCreating}>
          <FormError message={createState.error} />
          <div>
            <label htmlFor="nova_clinica_nome" className="block text-sm font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              id="nova_clinica_nome"
              name="nome"
              type="text"
              required
              disabled={isCreating}
              maxLength={NOME_CONSULTORIO_MAX}
              placeholder="Nome da clínica"
              className={INPUT_CLASS}
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isCreating && (
              <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Criar clínica
          </button>
        </form>
      </div>

    </div>
  );
}
