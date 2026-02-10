"use client";

import { useActionState } from "react";
import { alterarSenha, type ConfigFormState } from "./actions";

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

export function ContaForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    alterarSenha,
    {}
  );

  return (
    <div className="space-y-8">
      {/* Email info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">E-mail da conta</h3>
        <p className="mt-1 text-sm text-gray-600">{email}</p>
      </div>

      {/* Change password */}
      <form action={formAction} className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Alterar senha</h3>

        {state.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Senha alterada com sucesso.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
              Nova senha
            </label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className={inputClass}
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
              required
              minLength={6}
              placeholder="Repita a senha"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50"
          >
            {isPending && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Alterar senha
          </button>
        </div>
      </form>
    </div>
  );
}
