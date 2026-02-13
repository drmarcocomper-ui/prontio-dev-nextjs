"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";
import type { LoginFormState } from "./actions";
import { FormError, INPUT_CLASS } from "@/components/form-utils";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginFormState, FormData>(
    login,
    {}
  );

  return (
    <>
      <FormError message={state.error} />

      <form action={formAction} aria-label="Formulário de login" aria-busy={isPending} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            className={INPUT_CLASS}
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <Link
              href="/login/esqueci-senha"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Esqueci minha senha
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            className={INPUT_CLASS}
            placeholder="••••••••"
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
          Entrar
        </button>
      </form>
    </>
  );
}
