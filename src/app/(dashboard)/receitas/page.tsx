import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { SortSelect } from "@/components/sort-select";
import { SortableHeader } from "@/components/sortable-header";
import { SearchInput } from "@/components/search-input";
import { EmptyStateIllustration } from "@/components/empty-state";
import { escapeLikePattern } from "@/lib/sanitize";
import { getClinicaAtual } from "@/lib/clinica";
import { QueryError } from "@/components/query-error";
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

  const ctx = await getClinicaAtual();
  if (!ctx) return <QueryError title="Receitas" message="Sessão expirada." />;

  const supabase = await createClient();

  let query = supabase
    .from("receitas")
    .select("id, data, tipo, medicamentos, pacientes(id, nome)", { count: "exact" });

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
    return <QueryError title="Receitas" />;
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
        <>
        {/* Mobile Cards */}
        <div className="space-y-3 lg:hidden">
          {items.map((r) => (
            <Link
              key={r.id}
              href={`/receitas/${r.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4 transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                {getInitials(r.pacientes.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-gray-900">{r.pacientes.nome}</p>
                  {r.data && <span className="shrink-0 text-xs text-gray-500">{formatDate(r.data)}</span>}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {TIPO_LABELS[r.tipo] ?? r.tipo}
                  </span>
                  <span className="truncate">{r.medicamentos}</span>
                </div>
              </div>
              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader
                  label="Paciente"
                  column="paciente"
                  currentColumn={sortColumn}
                  currentDirection={sortDir}
                  basePath="/receitas"
                  searchParams={sp}
                />
                <SortableHeader
                  label="Data"
                  column="data"
                  currentColumn={sortColumn}
                  currentDirection={sortDir}
                  basePath="/receitas"
                  searchParams={sp}
                />
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Medicamentos
                </th>
                <th scope="col" className="w-12">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((r) => (
                <tr key={r.id} className="transition-colors even:bg-gray-50/50 hover:bg-primary-50/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/receitas/${r.id}`} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                        {getInitials(r.pacientes.nome)}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{r.pacientes.nome}</p>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {r.data ? formatDate(r.data) : <span className="text-gray-400">&mdash;</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {TIPO_LABELS[r.tipo] ?? r.tipo}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
                    {r.medicamentos}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/receitas/${r.id}`}
                      aria-label="Ver detalhes"
                      className="text-gray-400 transition-colors hover:text-gray-600"
                    >
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
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
