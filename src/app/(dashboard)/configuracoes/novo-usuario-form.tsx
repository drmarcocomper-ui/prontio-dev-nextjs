"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { INPUT_CLASS, FieldError, FormError, ariaProps } from "@/components/form-utils";
import { criarUsuario } from "@/app/(dashboard)/usuarios/actions";
import {
  EMAIL_MAX,
  SENHA_MIN,
  SENHA_MAX,
  PAPEL_OPTIONS,
  type UsuarioFormState,
} from "@/app/(dashboard)/usuarios/types";

interface NovoUsuarioFormProps {
  clinicas: { id: string; nome: string }[];
}

export function NovoUsuarioForm({ clinicas }: NovoUsuarioFormProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState<UsuarioFormState, FormData>(
    criarUsuario,
    {}
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Usuário criado com sucesso.");
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Novo usuário</h3>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {open ? (
            <>
              Cancelar
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </>
          ) : (
            <>
              Adicionar
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </>
          )}
        </button>
      </div>

      {open && (
        <form ref={formRef} action={action} className="mt-3 space-y-3" aria-busy={isPending}>
          <FormError message={state.error} />

          <div>
            <label htmlFor="novo_usuario_clinica" className="block text-sm font-medium text-gray-700">
              Clínica <span className="text-red-500">*</span>
            </label>
            <select
              id="novo_usuario_clinica"
              name="clinica_id"
              required
              disabled={isPending}
              className={INPUT_CLASS}
              {...ariaProps("clinica_id", state.fieldErrors?.clinica_id)}
            >
              {clinicas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <FieldError id="clinica_id-error" message={state.fieldErrors?.clinica_id} />
          </div>

          <div>
            <label htmlFor="novo_usuario_email" className="block text-sm font-medium text-gray-700">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              id="novo_usuario_email"
              name="email"
              type="email"
              required
              maxLength={EMAIL_MAX}
              disabled={isPending}
              placeholder="email@exemplo.com"
              className={INPUT_CLASS}
              {...ariaProps("email", state.fieldErrors?.email)}
            />
            <FieldError id="email-error" message={state.fieldErrors?.email} />
          </div>

          <div>
            <label htmlFor="novo_usuario_senha" className="block text-sm font-medium text-gray-700">
              Senha <span className="text-red-500">*</span>
            </label>
            <input
              id="novo_usuario_senha"
              name="senha"
              type="password"
              required
              minLength={SENHA_MIN}
              maxLength={SENHA_MAX}
              disabled={isPending}
              placeholder={`Mínimo ${SENHA_MIN} caracteres`}
              className={INPUT_CLASS}
              {...ariaProps("senha", state.fieldErrors?.senha)}
            />
            <FieldError id="senha-error" message={state.fieldErrors?.senha} />
          </div>

          <div>
            <label htmlFor="novo_usuario_papel" className="block text-sm font-medium text-gray-700">
              Papel <span className="text-red-500">*</span>
            </label>
            <select
              id="novo_usuario_papel"
              name="papel"
              required
              disabled={isPending}
              className={INPUT_CLASS}
              {...ariaProps("papel", state.fieldErrors?.papel)}
            >
              {PAPEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <FieldError id="papel-error" message={state.fieldErrors?.papel} />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isPending && (
              <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Criar usuário
          </button>
        </form>
      )}
    </div>
  );
}
