import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual } from "@/lib/clinica";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { EmptyStateIllustration } from "@/components/empty-state";
import { PapelFilter } from "./filters";
import { UsuarioRowActions } from "./usuario-actions";
import { type UsuarioListItem, PAPEL_BADGE } from "./types";

export const metadata: Metadata = { title: "Usuários" };

const PAGE_SIZE = 20;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string; papel?: string }>;
}) {
  const { q, pagina, papel } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);

  const ctx = await getClinicaAtual();
  if (!ctx) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Contexto de clínica não encontrado.
        </div>
      </div>
    );
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();

  let userIdFilter: string[] | null = null;

  // If searching, first find matching users by email
  if (q) {
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    if (authUsers?.users) {
      const escaped = q.toLowerCase();
      const matched = authUsers.users.filter((u) => u.email?.toLowerCase().includes(escaped));
      userIdFilter = matched.map((u) => u.id);
      if (userIdFilter.length === 0) {
        // No matching users found, return empty state
        return renderPage([], 0, currentPage, q, papel, ctx.userId);
      }
    }
  }

  const supabase = await createClient();

  let query = supabase
    .from("usuarios_clinicas")
    .select("id, user_id, papel, clinica_id, created_at, clinicas(nome)", { count: "exact" })
    .eq("clinica_id", ctx.clinicaId);

  if (userIdFilter) {
    query = query.in("user_id", userIdFilter);
  }

  if (papel) {
    query = query.eq("papel", papel);
  }

  query = query.order("created_at", { ascending: true });

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: vinculos, count, error } = await query;

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar os dados. Tente recarregar a página.
        </div>
      </div>
    );
  }

  // Enrich with emails from auth
  const userIds = (vinculos ?? []).map((v: { user_id: string }) => v.user_id);
  let emailMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    if (authUsers?.users) {
      emailMap = Object.fromEntries(
        authUsers.users
          .filter((u) => userIds.includes(u.id))
          .map((u) => [u.id, u.email ?? ""])
      );
    }
  }

  const items: UsuarioListItem[] = ((vinculos ?? []) as unknown as {
    id: string;
    user_id: string;
    papel: string;
    clinica_id: string;
    created_at: string;
    clinicas: { nome: string };
  }[]).map((v) => ({
    vinculo_id: v.id,
    user_id: v.user_id,
    email: emailMap[v.user_id] ?? "",
    papel: v.papel as UsuarioListItem["papel"],
    clinica_id: v.clinica_id,
    clinica_nome: v.clinicas?.nome ?? "",
    created_at: v.created_at,
  }));

  const totalItems = count ?? 0;

  return renderPage(items, totalItems, currentPage, q, papel, ctx.userId);
}

function renderPage(
  items: UsuarioListItem[],
  totalItems: number,
  currentPage: number,
  q: string | undefined,
  papel: string | undefined,
  currentUserId: string,
) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const sp: Record<string, string> = {};
  if (q) sp.q = q;
  if (papel) sp.papel = papel;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalItems} usuário{totalItems !== 1 ? "s" : ""} vinculado{totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/usuarios/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo usuário
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchInput basePath="/usuarios" placeholder="Buscar por e-mail..." ariaLabel="Buscar usuários" defaultValue={q} />
        </div>
        <PapelFilter currentPapel={papel ?? ""} />
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
              : "Comece criando o primeiro usuário."}
          </p>
          {!q && (
            <Link
              href="/usuarios/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Novo usuário
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        basePath="/usuarios"
        searchParams={sp}
      />
    </div>
  );
}
