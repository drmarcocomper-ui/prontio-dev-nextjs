"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { INPUT_CLASS, FormError, SubmitButton } from "@/components/form-utils";
import { criarUsuario, atualizarUsuario } from "../actions";
import { PAPEL_OPTIONS, EMAIL_MAX, SENHA_MIN, SENHA_MAX, type UsuarioFormState, type UsuarioDefaults } from "../types";

interface ClinicaOption {
  id: string;
  nome: string;
}

interface UsuarioFormProps {
  clinicas: ClinicaOption[];
  defaults?: UsuarioDefaults;
}

export function UsuarioForm({ clinicas, defaults }: UsuarioFormProps) {
  const isEditing = !!defaults?.vinculo_id;
  const router = useRouter();
  const [state, action, isPending] = useActionState<UsuarioFormState, FormData>(
    isEditing ? atualizarUsuario : criarUsuario,
    {}
  );

  useEffect(() => {
    if (state.success) {
      toast.success(isEditing ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso.");
      router.push("/usuarios");
    }
  }, [state, router, isEditing]);

  return (
    <form action={action} className="space-y-4" aria-busy={isPending}>
      <FormError message={state.error} />

      {isEditing && (
        <>
          <input type="hidden" name="vinculo_id" value={defaults.vinculo_id} />
          <input type="hidden" name="user_id" value={defaults.user_id} />
        </>
      )}

      <div>
        <label htmlFor="clinica_id" className="block text-sm font-medium text-gray-700">
          Clínica {!isEditing && <span className="text-red-500">*</span>}
        </label>
        {isEditing ? (
          <p className="mt-1 text-sm text-gray-900">{defaults.clinica_nome}</p>
        ) : (
          <select
            id="clinica_id"
            name="clinica_id"
            required
            disabled={isPending}
            className={INPUT_CLASS}
          >
            {clinicas.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-mail {!isEditing && <span className="text-red-500">*</span>}
        </label>
        {isEditing ? (
          <p className="mt-1 text-sm text-gray-900">{defaults.email}</p>
        ) : (
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={EMAIL_MAX}
            disabled={isPending}
            placeholder="email@exemplo.com"
            className={INPUT_CLASS}
          />
        )}
      </div>

      {!isEditing && (
        <div>
          <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
            Senha <span className="text-red-500">*</span>
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={SENHA_MIN}
            maxLength={SENHA_MAX}
            disabled={isPending}
            placeholder={`Mínimo ${SENHA_MIN} caracteres`}
            className={INPUT_CLASS}
          />
        </div>
      )}

      <div>
        <label htmlFor="papel" className="block text-sm font-medium text-gray-700">
          Papel <span className="text-red-500">*</span>
        </label>
        <select
          id="papel"
          name="papel"
          required
          disabled={isPending}
          defaultValue={defaults?.papel}
          className={INPUT_CLASS}
        >
          {PAPEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <SubmitButton label={isEditing ? "Salvar alterações" : "Criar usuário"} isPending={isPending} />
    </form>
  );
}
