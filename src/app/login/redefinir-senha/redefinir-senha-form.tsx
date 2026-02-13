"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormError, INPUT_CLASS } from "@/components/form-utils";
import { redefinirSenha, type ResetSenhaFormState } from "../actions";

export function RedefinirSenhaForm() {
  const [state, formAction, isPending] = useActionState<ResetSenhaFormState, FormData>(
    redefinirSenha,
    {}
  );

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p className="font-medium">Senha redefinida!</p>
          <p className="mt-1">Sua senha foi alterada com sucesso.</p>
        </div>
        <Link
          href="/login"
          className="block w-full rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <FormError message={state.error} />

      <form action={formAction} aria-busy={isPending} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Nova senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={isPending}
            className={INPUT_CLASS}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
            Confirmar nova senha
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={isPending}
            className={INPUT_CLASS}
            placeholder="Repita a senha"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Redefinir senha
        </button>
      </form>
    </>
  );
}
