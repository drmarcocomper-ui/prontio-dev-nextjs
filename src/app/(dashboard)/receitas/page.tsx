import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { SortSelect } from "@/components/sort-select";
import { SearchInput } from "@/components/search-input";
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
  const sortColumn = ordem || "data";
  const sortDir = dir === "asc" ? "asc" : "desc";
  const ascending = sortDir === "asc";

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
    query = query.or(`medicamentos.ilike.%${q}%,pacientes.nome.ilike.%${q}%`);
  }

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: receitas, count } = await query;
  const items = (receitas ?? []) as unknown as ReceitaListItem[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const sp: Record<string, string> = {};
  if (q) sp.q = q;
  if (ordem) sp.ordem = ordem;
  if (dir) sp.dir = dir;
  if (tipo) sp.tipo = tipo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receitas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalItems} registro{totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/receitas/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
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
              className="block rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300"
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
                    <span className="shrink-0 text-xs text-gray-500">
                      {formatDate(r.data)}
                    </span>
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <svg aria-hidden="true" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
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
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
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
