"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormError, INPUT_CLASS } from "@/components/form-utils";
import { enviarResetSenha, type ResetSenhaFormState } from "../actions";

export function EsqueciSenhaForm() {
  const [state, formAction, isPending] = useActionState<ResetSenhaFormState, FormData>(
    enviarResetSenha,
    {}
  );

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p className="font-medium">E-mail enviado!</p>
          <p className="mt-1">
            Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
            Verifique também a pasta de spam.
          </p>
        </div>
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <FormError message={state.error} />

      <form action={formAction} aria-busy={isPending} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={isPending}
            className={INPUT_CLASS}
            placeholder="seu@email.com"
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
          Enviar link de recuperação
        </button>
      </form>

      <Link
        href="/login"
        className="block text-center text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        Voltar para o login
      </Link>
    </>
  );
}
