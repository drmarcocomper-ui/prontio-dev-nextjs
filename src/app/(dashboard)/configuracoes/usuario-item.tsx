"use client";

import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { removerVinculo } from "@/app/(dashboard)/usuarios/actions";
import {
  type UsuarioListItem,
  PAPEL_BADGE,
} from "@/app/(dashboard)/usuarios/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function UsuarioItem({
  usuario,
  isSelf,
}: {
  usuario: UsuarioListItem;
  isSelf: boolean;
}) {
  const badge = PAPEL_BADGE[usuario.papel];

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">
              {usuario.email || usuario.user_id.slice(0, 8)}
            </p>
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge?.className ?? "bg-gray-50 text-gray-700"}`}
            >
              {badge?.label ?? usuario.papel}
            </span>
            {isSelf && (
              <span className="inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                Você
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {usuario.clinica_nome} · {formatDate(usuario.created_at)}
          </p>
        </div>

        {/* Action buttons — only for non-self */}
        {!isSelf && (
          <div className="flex shrink-0 items-center gap-1">
            {/* Edit — navigate to full edit page */}
            <Link
              href={`/usuarios/${usuario.vinculo_id}/editar`}
              title="Editar usuário"
              aria-label="Editar usuário"
              className="text-gray-400 transition-colors hover:text-primary-600"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </Link>

            {/* Delete (remove vínculo) */}
            <DeleteButton
              variant="icon"
              onDelete={() => removerVinculo(usuario.vinculo_id)}
              title="Remover usuário"
              description="Tem certeza que deseja remover este usuário da clínica? Esta ação não pode ser desfeita."
              errorMessage="Erro ao remover usuário."
            />
          </div>
        )}
      </div>
    </div>
  );
}
