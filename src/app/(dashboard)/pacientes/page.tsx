import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { SortableHeader } from "@/components/sortable-header";
import { SearchInput } from "@/components/search-input";
import { EmptyStateIllustration } from "@/components/empty-state";
import { escapeLikePattern } from "@/lib/sanitize";
import { redirect } from "next/navigation";
import { getClinicaAtual } from "@/lib/clinica";
import { QueryError } from "@/components/query-error";
import { PacienteFilters } from "./filters";
import { ExportCsvButton } from "./export-csv-button";
import { type PacienteListItem, formatCPF, formatPhone, formatDate, getInitials } from "./types";

export const metadata: Metadata = { title: "Pacientes" };

const PAGE_SIZE = 20;

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string; ordem?: string; dir?: string; sexo?: string }>;
}) {
  const { q, pagina, ordem, dir, sexo } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);
  const VALID_SORT_COLUMNS = ["nome", "data_nascimento"];
  const sortColumn = VALID_SORT_COLUMNS.includes(ordem ?? "") ? ordem! : "nome";
  const sortDir = dir === "desc" ? "desc" : "asc";
  const ascending = sortDir === "asc";

  const ctx = await getClinicaAtual();
  if (!ctx) redirect("/login");

  const supabase = await createClient();

  let query = supabase
    .from("pacientes")
    .select("id, nome, cpf, telefone, email, data_nascimento", { count: "exact" })
    .order(sortColumn, { ascending });

  if (q) {
    const escaped = escapeLikePattern(q);
    query = query.or(`nome.ilike.%${escaped}%,cpf.ilike.%${escaped}%,telefone.ilike.%${escaped}%`);
  }

  if (sexo) {
    query = query.eq("sexo", sexo);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: pacientes, count, error } = await query;

  if (error) {
    return <QueryError title="Pacientes" />;
  }

  const items = (pacientes ?? []) as PacienteListItem[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const sp: Record<string, string> = {};
  if (q) sp.q = q;
  if (ordem) sp.ordem = ordem;
  if (dir) sp.dir = dir;
  if (sexo) sp.sexo = sexo;

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalItems} paciente{totalItems !== 1 ? "s" : ""} cadastrado{totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton totalItems={totalItems} />
          <Link
            href="/pacientes/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo paciente
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchInput basePath="/pacientes" placeholder="Buscar por nome, CPF ou telefone..." ariaLabel="Buscar pacientes" defaultValue={q} />
        </div>
        <PacienteFilters currentSexo={sexo ?? ""} />
      </div>

      {/* Mobile Cards */}
      {items.length > 0 ? (
        <>
        <div className="space-y-3 lg:hidden">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/pacientes/${p.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4 transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                {getInitials(p.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{p.nome}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  {p.telefone && (
                    <span>{formatPhone(p.telefone)}</span>
                  )}
                  {p.cpf && (
                    <span>{formatCPF(p.cpf)}</span>
                  )}
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
                  column="nome"
                  currentColumn={sortColumn}
                  currentDirection={sortDir}
                  basePath="/pacientes"
                  searchParams={sp}
                />
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  CPF
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Telefone
                </th>
                <SortableHeader
                  label="Nascimento"
                  column="data_nascimento"
                  currentColumn={sortColumn}
                  currentDirection={sortDir}
                  basePath="/pacientes"
                  searchParams={sp}
                />
                <th scope="col" className="w-12">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((p) => (
                <tr key={p.id} className="transition-colors even:bg-gray-50/50 hover:bg-primary-50/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/pacientes/${p.id}`} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                        {getInitials(p.nome)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.nome}
                        </p>
                        {p.email && (
                          <p className="text-xs text-gray-500">{p.email}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {p.cpf ? formatCPF(p.cpf) : "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {p.telefone ? (
                      <a href={`tel:${p.telefone.replace(/\D/g, "")}`} className="transition-colors hover:text-primary-600 hover:underline">
                        {formatPhone(p.telefone)}
                      </a>
                    ) : "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {p.data_nascimento ? formatDate(p.data_nascimento) : "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/pacientes/${p.id}`}
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
          <EmptyStateIllustration type="pacientes" />
          <h3 className="mt-6 text-sm font-semibold text-gray-900">
            Nenhum paciente encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {q
              ? "Tente buscar com outros termos."
              : "Comece cadastrando seu primeiro paciente."}
          </p>
          {!q && (
            <Link
              href="/pacientes/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Novo paciente
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
        basePath="/pacientes"
        searchParams={sp}
      />
    </div>
  );
}

