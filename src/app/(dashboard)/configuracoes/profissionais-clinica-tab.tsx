"use client";

import { useState } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { removerVinculo } from "@/app/(dashboard)/usuarios/actions";
import { PAPEL_BADGE } from "@/app/(dashboard)/usuarios/types";
import { NovoUsuarioForm } from "./novo-usuario-form";

export interface ProfissionalClinicaItem {
  vinculo_id: string;
  user_id: string;
  email: string;
  papel: string;
  nome_profissional: string;
  especialidade: string;
  crm: string;
  rqe: string;
}

export function ProfissionaisClinicaTab({
  items,
  currentUserId,
  clinicas,
}: {
  items: ProfissionalClinicaItem[];
  currentUserId: string;
  clinicas: { id: string; nome: string }[];
}) {
  const [busca, setBusca] = useState("");

  const filtered = busca
    ? items.filter((p) => {
        const term = busca.toLowerCase();
        return (
          p.nome_profissional.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term) ||
          p.especialidade.toLowerCase().includes(term)
        );
      })
    : items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Profissionais da clínica</h3>
        <p className="mt-1 text-xs text-gray-500">
          {items.length} profissional{items.length !== 1 ? "is" : ""} vinculado{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      {items.length > 0 && (
        <div>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou especialidade..."
            aria-label="Buscar profissionais"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      )}

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((p) => {
            const badge = PAPEL_BADGE[p.papel];
            const isSelf = p.user_id === currentUserId;
            const displayName = p.nome_profissional || p.email || p.user_id.slice(0, 8);

            return (
              <div key={p.vinculo_id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge?.className ?? "bg-gray-50 text-gray-700"}`}
                      >
                        {badge?.label ?? p.papel}
                      </span>
                      {isSelf && (
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                      {p.especialidade && <span>{p.especialidade}</span>}
                      {p.crm && (
                        <>
                          {p.especialidade && <span aria-hidden="true">·</span>}
                          <span>{p.crm}</span>
                        </>
                      )}
                      {p.rqe && (
                        <>
                          {(p.especialidade || p.crm) && <span aria-hidden="true">·</span>}
                          <span>RQE {p.rqe}</span>
                        </>
                      )}
                      {p.nome_profissional && p.email && (
                        <>
                          {(p.especialidade || p.crm || p.rqe) && <span aria-hidden="true">·</span>}
                          <span>{p.email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons — only for non-self */}
                  {!isSelf && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/usuarios/${p.vinculo_id}/editar`}
                        title="Editar profissional"
                        aria-label="Editar profissional"
                        className="text-gray-400 transition-colors hover:text-primary-600"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </Link>
                      <DeleteButton
                        variant="icon"
                        onDelete={() => removerVinculo(p.vinculo_id)}
                        title="Remover profissional"
                        description="Tem certeza que deseja remover este profissional da clínica? Esta ação não pode ser desfeita."
                        errorMessage="Erro ao remover profissional."
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 px-6 py-12 text-center">
          <svg aria-hidden="true" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <h3 className="mt-6 text-sm font-semibold text-gray-900">
            Nenhum profissional encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {busca
              ? "Tente buscar com outros termos."
              : "Adicione um profissional usando o formulário abaixo."}
          </p>
        </div>
      )}

      {/* Inline create form */}
      <NovoUsuarioForm clinicas={clinicas} />
    </div>
  );
}
