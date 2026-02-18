import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { EmptyStateIllustration } from "@/components/empty-state";
import { PapelFilter } from "@/app/(dashboard)/usuarios/filters";
import { type UsuarioListItem } from "@/app/(dashboard)/usuarios/types";
import { UsuarioItem } from "./usuario-item";
import { NovoUsuarioForm } from "./novo-usuario-form";

const PAGE_SIZE = 20;

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Seus usuários</h3>
        <p className="mt-1 text-xs text-gray-500">
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

      {/* User list (card items like ClinicaItem) */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((u) => (
            <UsuarioItem
              key={u.vinculo_id}
              usuario={u}
              isSelf={u.user_id === currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 px-6 py-12 text-center">
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
