import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { SortSelect } from "@/components/sort-select";
import { SearchInput } from "@/components/search-input";
import { escapeLikePattern } from "@/lib/sanitize";
import { ProntuarioFilters } from "./filters";
import { type ProntuarioListItem, TIPO_LABELS, formatDate, getInitials } from "./types";

export const metadata: Metadata = { title: "Prontuários" };

const PAGE_SIZE = 20;

export default async function ProntuariosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    pagina?: string;
    ordem?: string;
    dir?: string;
    tipo?: string;
    de?: string;
    ate?: string;
  }>;
}) {
  const { q, pagina, ordem, dir, tipo, de, ate } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);
  const VALID_SORT_COLUMNS = ["data", "paciente"];
  const sortColumn = VALID_SORT_COLUMNS.includes(ordem ?? "") ? ordem! : "data";
  const sortDir = dir === "asc" ? "asc" : "desc";
  const ascending = sortDir === "asc";

  const supabase = await createClient();

  let query = supabase
    .from("prontuarios")
    .select(
      "id, data, tipo, cid, queixa_principal, conduta, pacientes(id, nome)",
      { count: "exact" }
    );

  if (sortColumn === "paciente") {
    query = query.order("pacientes(nome)", { ascending });
  } else {
    query = query.order(sortColumn, { ascending });
  }
  query = query.order("created_at", { ascending: false });

  if (q) {
    const escaped = escapeLikePattern(q);
    query = query.or(`cid.ilike.%${escaped}%,queixa_principal.ilike.%${escaped}%,pacientes.nome.ilike.%${escaped}%`);
  }

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  if (de) {
    query = query.gte("data", de);
  }

  if (ate) {
    query = query.lte("data", ate);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: prontuarios, count, error } = await query;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prontuários</h1>
          </div>
        </div>
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar os dados. Tente recarregar a página.
        </div>
      </div>
    );
  }

  const items = (prontuarios ?? []) as unknown as ProntuarioListItem[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const sp: Record<string, string> = {};
  if (q) sp.q = q;
  if (ordem) sp.ordem = ordem;
  if (dir) sp.dir = dir;
  if (tipo) sp.tipo = tipo;
  if (de) sp.de = de;
  if (ate) sp.ate = ate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prontuários</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalItems} registro{totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/prontuarios/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova evolução
        </Link>
      </div>

      {/* Search */}
      <SearchInput basePath="/prontuarios" placeholder="Buscar por paciente ou CID..." ariaLabel="Buscar prontuários" defaultValue={q} />

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProntuarioFilters
          currentTipo={tipo ?? ""}
          currentDe={de ?? ""}
          currentAte={ate ?? ""}
        />
        <SortSelect
          options={[
            { label: "Data (mais recente)", column: "data", direction: "desc" },
            { label: "Data (mais antiga)", column: "data", direction: "asc" },
            { label: "Paciente (A-Z)", column: "paciente", direction: "asc" },
            { label: "Paciente (Z-A)", column: "paciente", direction: "desc" },
          ]}
          currentColumn={sortColumn}
          currentDirection={sortDir}
          basePath="/prontuarios"
        />
      </div>

      {/* List */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/prontuarios/${p.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                  {getInitials(p.pacientes.nome)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {p.pacientes.nome}
                    </p>
                    <span className="shrink-0 text-xs text-gray-500">
                      {formatDate(p.data)}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {p.tipo && (
                      <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        {TIPO_LABELS[p.tipo] ?? p.tipo}
                      </span>
                    )}
                    {p.cid && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        CID: {p.cid}
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  {p.queixa_principal && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-700">QP:</span>{" "}
                      {p.queixa_principal}
                    </p>
                  )}
                  {!p.queixa_principal && p.conduta && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-700">Conduta:</span>{" "}
                      {p.conduta}
                    </p>
                  )}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            Nenhum prontuário encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {q
              ? "Tente buscar com outros termos."
              : "Registre a primeira evolução clínica."}
          </p>
          {!q && (
            <Link
              href="/prontuarios/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nova evolução
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
        basePath="/prontuarios"
        searchParams={sp}
      />
    </div>
  );
}
