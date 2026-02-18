import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { EmptyStateIllustration } from "@/components/empty-state";
import { PapelFilter } from "@/app/(dashboard)/usuarios/filters";
import { UsuarioRowActions } from "@/app/(dashboard)/usuarios/usuario-actions";
import { type UsuarioListItem, PAPEL_BADGE } from "@/app/(dashboard)/usuarios/types";
import { NovoUsuarioForm } from "./novo-usuario-form";

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function UsuariosTab({
  items,
  totalItems,
  currentPage,
  q,
  papel,
  currentUserId,
  clinicas,
}: {
  items: UsuarioListItem[];
  totalItems: number;
  currentPage: number;
  q: string | undefined;
  papel: string | undefined;
  currentUserId: string;
  clinicas: { id: string; nome: string }[];
}) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const sp: Record<string, string> = { tab: "usuarios" };
  if (q) sp.q = q;
  if (papel) sp.papel = papel;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Usuários</h2>
        <p className="mt-1 text-sm text-gray-500">
          {totalItems} usuário{totalItems !== 1 ? "s" : ""} vinculado{totalItems !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchInput basePath="/configuracoes" placeholder="Buscar por e-mail..." ariaLabel="Buscar usuários" defaultValue={q} />
        </div>
        <PapelFilter currentPapel={papel ?? ""} basePath="/configuracoes" />
      </div>

      {/* Content */}
      {items.length > 0 ? (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 lg:hidden">
            {items.map((u) => {
              const badge = PAPEL_BADGE[u.papel];
              const isSelf = u.user_id === currentUserId;
              return (
                <div
                  key={u.vinculo_id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{u.email || u.user_id.slice(0, 8)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge?.className ?? "bg-gray-50 text-gray-700"}`}
                        >
                          {badge?.label ?? u.papel}
                        </span>
                        {isSelf && (
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(u.created_at)}</p>
                    </div>
                    {!isSelf && (
                      <div className="shrink-0">
                        <UsuarioRowActions usuario={u} isSelf={false} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    E-mail
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Papel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Clínica
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Data
                  </th>
                  <th scope="col" className="w-12">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((u) => {
                  const badge = PAPEL_BADGE[u.papel];
                  const isSelf = u.user_id === currentUserId;
                  return (
                    <tr key={u.vinculo_id} className="transition-colors even:bg-gray-50/50 hover:bg-primary-50/50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {u.email || u.user_id.slice(0, 8)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge?.className ?? "bg-gray-50 text-gray-700"}`}
                        >
                          {badge?.label ?? u.papel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {u.clinica_nome}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {isSelf ? (
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                            Você
                          </span>
                        ) : (
                          <UsuarioRowActions usuario={u} isSelf={false} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
          <EmptyStateIllustration type="usuarios" />
          <h3 className="mt-6 text-sm font-semibold text-gray-900">
            Nenhum usuário encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {q
              ? "Tente buscar com outros termos."
              : "Comece criando o primeiro usuário no formulário abaixo."}
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        basePath="/configuracoes"
        searchParams={sp}
      />

      {/* Inline create form */}
      <NovoUsuarioForm clinicas={clinicas} />
    </div>
  );
}
