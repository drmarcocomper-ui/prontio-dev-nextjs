import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { SortSelect } from "@/components/sort-select";
import { SearchInput } from "@/components/search-input";
import { EmptyStateIllustration } from "@/components/empty-state";
import { escapeLikePattern } from "@/lib/sanitize";
import { getClinicaAtual } from "@/lib/clinica";
import { uuidValido, DATE_RE } from "@/lib/validators";
import { QueryError } from "@/components/query-error";
import { ProntuarioFilters } from "./filters";
import { type ProntuarioListItem, TIPO_LABELS, formatDate, getInitials } from "./types";

export const metadata: Metadata = { title: "Prontuários" };

const VALID_TIPO = new Set<string>(Object.keys(TIPO_LABELS));

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
    paciente_id?: string;
  }>;
}) {
  const { q, pagina, ordem, dir, tipo, de, ate, paciente_id } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);
  const VALID_SORT_COLUMNS = ["data", "paciente"];
  const sortColumn = VALID_SORT_COLUMNS.includes(ordem ?? "") ? ordem! : "data";
  const sortDir = dir === "asc" ? "asc" : "desc";
  const ascending = sortDir === "asc";

  const ctx = await getClinicaAtual();
  if (!ctx) return <QueryError title="Prontuários" message="Sessão expirada." />;

  const supabase = await createClient();

  let query = supabase
    .from("prontuarios")
    .select(
      "id, data, tipo, queixa_principal, pacientes(id, nome)",
      { count: "exact" }
    );

  if (sortColumn === "paciente") {
    query = query.order("pacientes(nome)", { ascending });
  } else {
    query = query.order(sortColumn, { ascending });
  }
  query = query.order("created_at", { ascending: false });

  if (paciente_id) {
    if (!uuidValido(paciente_id)) {
      return <QueryError title="Prontuários" message="Paciente inválido." />;
    }
    query = query.eq("paciente_id", paciente_id);
  }

  if (q) {
    const escaped = escapeLikePattern(q);
    query = query.or(`queixa_principal.ilike.%${escaped}%,pacientes.nome.ilike.%${escaped}%`);
  }

  if (tipo && VALID_TIPO.has(tipo)) {
    query = query.eq("tipo", tipo);
  }

  if (de && DATE_RE.test(de)) {
    query = query.gte("data", de);
  }

  if (ate && DATE_RE.test(ate)) {
    query = query.lte("data", ate);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: prontuarios, count, error } = await query;

  if (error) {
    return <QueryError title="Prontuários" />;
  }

  const items = (prontuarios ?? []) as unknown as ProntuarioListItem[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  let pacienteNome = "";
  if (paciente_id) {
    const fromResults = items.find((i) => i.pacientes.id === paciente_id);
    if (fromResults) {
      pacienteNome = fromResults.pacientes.nome;
    } else {
      const { data: pacienteData } = await supabase
        .from("pacientes")
        .select("nome")
        .eq("id", paciente_id)
        .single();
      pacienteNome = pacienteData?.nome ?? "";
    }
  }

  const sp: Record<string, string> = {};
  if (q) sp.q = q;
  if (ordem) sp.ordem = ordem;
  if (dir) sp.dir = dir;
  if (tipo) sp.tipo = tipo;
  if (de) sp.de = de;
  if (ate) sp.ate = ate;
  if (paciente_id) sp.paciente_id = paciente_id;

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
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
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova evolução
        </Link>
      </div>

      {/* Search */}
      <SearchInput basePath="/prontuarios" placeholder="Buscar por paciente ou evolução..." ariaLabel="Buscar prontuários" defaultValue={q} />

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProntuarioFilters
          currentTipo={tipo ?? ""}
          currentDe={de ?? ""}
          currentAte={ate ?? ""}
          pacienteId={paciente_id ?? ""}
          pacienteNome={pacienteNome}
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
              className="block rounded-xl border border-gray-200 bg-white shadow-sm p-4 transition-all hover:border-gray-300 hover:shadow-md sm:p-5"
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
                  {p.tipo && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        {TIPO_LABELS[p.tipo] ?? p.tipo}
                      </span>
                    </div>
                  )}

                  {/* Preview */}
                  {p.queixa_principal && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {p.queixa_principal}
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
          <EmptyStateIllustration type="prontuarios" />
          <h3 className="mt-6 text-sm font-semibold text-gray-900">
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
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
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
