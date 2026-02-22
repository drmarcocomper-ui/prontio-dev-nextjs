"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "./actions";
import type { SignupFormState } from "./actions";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import { SENHA_MIN, SENHA_MAX, EMAIL_MAX } from "@/app/(dashboard)/configuracoes/constants";

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState<SignupFormState, FormData>(
    signup,
    {}
  );

  return (
    <>
      <FormError message={state.error} />

      <form action={formAction} aria-label="Formulário de cadastro" aria-busy={isPending} className="space-y-4">
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
            maxLength={EMAIL_MAX}
            disabled={isPending}
            className={INPUT_CLASS}
            placeholder="seu@email.com"
            {...ariaProps("email", state.fieldErrors?.email)}
          />
          <FieldError id="email-error" message={state.fieldErrors?.email} />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={SENHA_MIN}
            maxLength={SENHA_MAX}
            disabled={isPending}
            className={INPUT_CLASS}
            placeholder="Mínimo 6 caracteres"
            {...ariaProps("password", state.fieldErrors?.password)}
          />
          <FieldError id="password-error" message={state.fieldErrors?.password} />
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
            Confirmar senha
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            maxLength={SENHA_MAX}
            disabled={isPending}
            className={INPUT_CLASS}
            placeholder="Repita sua senha"
            {...ariaProps("confirm_password", state.fieldErrors?.confirm_password)}
          />
          <FieldError id="confirm_password-error" message={state.fieldErrors?.confirm_password} />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="aceite_termos"
            name="aceite_termos"
            type="checkbox"
            required
            disabled={isPending}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            {...ariaProps("aceite_termos", state.fieldErrors?.aceite_termos)}
          />
          <label htmlFor="aceite_termos" className="text-sm text-gray-600">
            Li e aceito os{" "}
            <Link href="/termos" target="_blank" className="font-medium text-primary-600 hover:text-primary-700">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" target="_blank" className="font-medium text-primary-600 hover:text-primary-700">
              Política de Privacidade
            </Link>
            .
          </label>
        </div>
        <FieldError id="aceite_termos-error" message={state.fieldErrors?.aceite_termos} />

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Criar conta
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Entrar
        </Link>
      </p>
    </>
  );
}
