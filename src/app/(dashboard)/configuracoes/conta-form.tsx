"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { alterarSenha, type ConfigFormState } from "./actions";
import { INPUT_CLASS, SENHA_MIN, SENHA_MAX } from "./constants";

export function ContaForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState<ConfigFormState, FormData>(
    alterarSenha,
    {}
  );

  useEffect(() => {
    if (state.success) toast.success("Senha alterada com sucesso.");
  }, [state]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Email info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">E-mail da conta</h3>
        <p className="mt-1 text-sm text-gray-600">{email}</p>
      </div>

      {/* Change password */}
      <form action={formAction} className="space-y-4" aria-busy={isPending}>
        <h3 className="text-sm font-semibold text-gray-900">Alterar senha</h3>

        <FormError message={state.error} />

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
              disabled={isPending}
              minLength={SENHA_MIN}
              maxLength={SENHA_MAX}
              placeholder="Mínimo 6 caracteres"
              className={INPUT_CLASS}
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
              disabled={isPending}
              minLength={SENHA_MIN}
              maxLength={SENHA_MAX}
              placeholder="Repita a senha"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50"
          >
            {isPending && (
              <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Alterar senha
          </button>
        </div>
      </form>
    </div>
  );
}
