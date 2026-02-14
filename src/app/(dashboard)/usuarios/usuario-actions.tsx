"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DeleteButton } from "@/components/delete-button";
import { FormError } from "@/components/form-utils";
import { atualizarPapel, resetarSenha, removerVinculo } from "./actions";
import { type UsuarioListItem, PAPEL_OPTIONS, SENHA_MIN, SENHA_MAX, type UsuarioFormState } from "./types";

function PapelSelect({ usuario }: { usuario: UsuarioListItem }) {
  const [state, action, isPending] = useActionState<UsuarioFormState, FormData>(
    atualizarPapel,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) toast.success("Papel atualizado.");
    if (state.error) toast.error(state.error);
  }, [state]);

  const isSuperadmin = usuario.papel === "superadmin";

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="vinculo_id" value={usuario.vinculo_id} />
      <input type="hidden" name="user_id" value={usuario.user_id} />
      <select
        name="papel"
        defaultValue={usuario.papel}
        disabled={isSuperadmin || isPending}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Alterar papel"
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
      >
        {isSuperadmin && <option value="superadmin">Superadmin</option>}
        {PAPEL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}

function ResetSenhaButton({ usuario }: { usuario: UsuarioListItem }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState<UsuarioFormState, FormData>(
    resetarSenha,
    {}
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Senha resetada com sucesso.");
      setOpen(false);
    }
  }, [state]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Resetar senha"
        aria-label="Resetar senha"
        className="text-gray-400 transition-colors hover:text-primary-600"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-gray-900/50" onClick={() => !isPending && setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="relative z-50 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Resetar senha</h3>
            <p className="mt-1 text-sm text-gray-500">
              Defina uma nova senha para {usuario.email || "este usuário"}.
            </p>

            <form action={action} className="mt-4 space-y-3">
              <input type="hidden" name="user_id" value={usuario.user_id} />
              <FormError message={state.error} />
              <div>
                <label htmlFor={`reset-senha-${usuario.vinculo_id}`} className="block text-sm font-medium text-gray-700">
                  Nova senha
                </label>
                <input
                  id={`reset-senha-${usuario.vinculo_id}`}
                  name="senha"
                  type="password"
                  required
                  minLength={SENHA_MIN}
                  maxLength={SENHA_MAX}
                  disabled={isPending}
                  placeholder={`Mínimo ${SENHA_MIN} caracteres`}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {isPending && (
                    <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  Resetar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function RemoverVinculoButton({ vinculoId }: { vinculoId: string }) {
  return (
    <DeleteButton
      variant="icon"
      onDelete={() => removerVinculo(vinculoId)}
      title="Remover vínculo"
      description="Tem certeza que deseja remover este usuário da clínica? Ele perderá acesso."
      errorMessage="Erro ao remover vínculo."
    />
  );
}

export function UsuarioRowActions({
  usuario,
  isSelf,
}: {
  usuario: UsuarioListItem;
  isSelf: boolean;
}) {
  if (isSelf) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
        Você
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <PapelSelect usuario={usuario} />
      <Link
        href={`/usuarios/${usuario.vinculo_id}/editar`}
        title="Editar usuário"
        aria-label="Editar usuário"
        className="text-gray-400 transition-colors hover:text-primary-600"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      </Link>
      <ResetSenhaButton usuario={usuario} />
      <RemoverVinculoButton vinculoId={usuario.vinculo_id} />
    </div>
  );
}
