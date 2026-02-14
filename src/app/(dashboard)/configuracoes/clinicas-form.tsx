"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-utils";
import { criarClinica, convidarSecretaria, type ConfigFormState } from "./actions";
import { INPUT_CLASS, NOME_CONSULTORIO_MAX } from "./constants";

interface ClinicaInfo {
  id: string;
  nome: string;
}

interface UsuarioClinica {
  id: string;
  user_id: string;
  papel: string;
  email?: string;
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

  const [inviteState, inviteAction, isInviting] = useActionState<ConfigFormState, FormData>(
    convidarSecretaria,
    {}
  );

  useEffect(() => {
    if (createState.success) toast.success("Clínica criada com sucesso.");
  }, [createState]);

  useEffect(() => {
    if (inviteState.success) toast.success("Secretária vinculada com sucesso.");
  }, [inviteState]);

  return (
    <div className="space-y-8">
      {/* Existing Clinics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Suas clínicas</h3>
        <div className="mt-3 space-y-2">
          {clinicas.map((c) => {
            const clinicaVinculos = vinculos.filter((v) => v.id === c.id);
            return (
              <div key={c.id} className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">{c.nome}</p>
                {clinicaVinculos.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {clinicaVinculos.map((v) => (
                      <div key={v.user_id} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          v.papel === "admin"
                            ? "bg-purple-50 text-purple-700"
                            : v.papel === "medico"
                              ? "bg-primary-50 text-primary-700"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {v.papel === "admin" ? "Admin" : v.papel === "medico" ? "Médico" : "Secretária"}
                        </span>
                        <span>{v.email || v.user_id.slice(0, 8)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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

      {/* Invite Secretary */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Convidar secretária</h3>
        <p className="mt-1 text-xs text-gray-500">
          A secretária terá acesso à agenda e pacientes de todas as suas clínicas.
        </p>
        <form action={inviteAction} className="mt-3 space-y-3" aria-busy={isInviting}>
          <FormError message={inviteState.error} />
          <div>
            <label htmlFor="secretaria_clinica" className="block text-sm font-medium text-gray-700">
              Clínica
            </label>
            <select
              id="secretaria_clinica"
              name="clinica_id"
              required
              disabled={isInviting}
              className={INPUT_CLASS}
            >
              {clinicas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="secretaria_email" className="block text-sm font-medium text-gray-700">
              E-mail da secretária <span className="text-red-500">*</span>
            </label>
            <input
              id="secretaria_email"
              name="email"
              type="email"
              required
              maxLength={254}
              disabled={isInviting}
              placeholder="email@exemplo.com"
              className={INPUT_CLASS}
            />
          </div>
          <button
            type="submit"
            disabled={isInviting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isInviting && (
              <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Convidar
          </button>
        </form>
      </div>
    </div>
  );
}
