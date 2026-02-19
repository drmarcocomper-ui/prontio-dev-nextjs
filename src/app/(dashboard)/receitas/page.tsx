import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { SortSelect } from "@/components/sort-select";
import { SearchInput } from "@/components/search-input";
import { EmptyStateIllustration } from "@/components/empty-state";
import { escapeLikePattern } from "@/lib/sanitize";
import { redirect } from "next/navigation";
import { getMedicoId } from "@/lib/clinica";
import { ReceitaFilters } from "./filters";
import {
  type ReceitaListItem,
  TIPO_LABELS,
  formatDate,
  getInitials,
} from "./types";

export const metadata: Metadata = { title: "Receitas" };

const PAGE_SIZE = 20;

export default async function ReceitasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    pagina?: string;
    ordem?: string;
    dir?: string;
    tipo?: string;
  }>;
}) {
  const { q, pagina, ordem, dir, tipo } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);
  const VALID_SORT_COLUMNS = ["data", "paciente"];
  const sortColumn = VALID_SORT_COLUMNS.includes(ordem ?? "") ? ordem! : "data";
  const sortDir = dir === "asc" ? "asc" : "desc";
  const ascending = sortDir === "asc";

  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    redirect("/login");
  }

  let query = supabase
    .from("receitas")
    .select("id, data, tipo, medicamentos, pacientes(id, nome)", { count: "exact" })
    .eq("medico_id", medicoId);

  if (sortColumn === "paciente") {
    query = query.order("pacientes(nome)", { ascending });
  } else {
    query = query.order(sortColumn, { ascending });
  }
  query = query.order("created_at", { ascending: false });

  if (q) {
    const escaped = escapeLikePattern(q);
    query = query.or(`medicamentos.ilike.%${escaped}%,pacientes.nome.ilike.%${escaped}%`);
  }

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: receitas, count, error } = await query;

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Receitas</h1>
          </div>
        </div>
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar os dados. Tente recarregar a página.
        </div>
      </div>
    );
  }

  const items = (receitas ?? []) as unknown as ReceitaListItem[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const sp: Record<string, string> = {};
  if (q) sp.q = q;
  if (ordem) sp.ordem = ordem;
  if (dir) sp.dir = dir;
  if (tipo) sp.tipo = tipo;

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receitas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalItems} registro{totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/receitas/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova receita
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchInput basePath="/receitas" placeholder="Buscar por paciente ou medicamento..." ariaLabel="Buscar receitas" defaultValue={q} />
        </div>
        <ReceitaFilters currentTipo={tipo ?? ""} />
      </div>

      {/* Sort */}
      <SortSelect
        options={[
          { label: "Data (mais recente)", column: "data", direction: "desc" },
          { label: "Data (mais antiga)", column: "data", direction: "asc" },
          { label: "Paciente (A-Z)", column: "paciente", direction: "asc" },
          { label: "Paciente (Z-A)", column: "paciente", direction: "desc" },
        ]}
        currentColumn={sortColumn}
        currentDirection={sortDir}
        basePath="/receitas"
      />

      {/* List */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((r) => (
            <Link
              key={r.id}
              href={`/receitas/${r.id}`}
              className="block rounded-xl border border-gray-200 bg-white shadow-sm p-4 transition-all hover:border-gray-300 hover:shadow-md sm:p-5"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                  {getInitials(r.pacientes.nome)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {r.pacientes.nome}
                    </p>
                    {r.data && (
                      <span className="shrink-0 text-xs text-gray-500">
                        {formatDate(r.data)}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {TIPO_LABELS[r.tipo] ?? r.tipo}
                    </span>
                  </div>

                  {/* Preview */}
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {r.medicamentos}
                  </p>
                </div>

                {/* Chevron */}
                <svg aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
          <EmptyStateIllustration type="receitas" />
          <h3 className="mt-6 text-sm font-semibold text-gray-900">
            Nenhuma receita encontrada
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {q
              ? "Tente buscar com outros termos."
              : "Emita a primeira receita médica."}
          </p>
          {!q && (
            <Link
              href="/receitas/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nova receita
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
        basePath="/receitas"
        searchParams={sp}
      />
    </div>
  );
}
