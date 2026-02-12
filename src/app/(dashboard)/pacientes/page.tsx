import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/pagination";
import { SortableHeader } from "@/components/sortable-header";
import { SearchInput } from "@/components/search-input";
import { PacienteFilters } from "./filters";
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
  const sortColumn = ordem || "nome";
  const sortDir = dir === "desc" ? "desc" : "asc";
  const ascending = sortDir === "asc";

  const supabase = await createClient();

  let query = supabase
    .from("pacientes")
    .select("id, nome, cpf, telefone, email, data_nascimento", { count: "exact" })
    .order(sortColumn, { ascending });

  if (q) {
    query = query.or(`nome.ilike.%${q}%,cpf.ilike.%${q}%,telefone.ilike.%${q}%`);
  }

  if (sexo) {
    query = query.eq("sexo", sexo);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: pacientes, count } = await query;
  const items = (pacientes ?? []) as PacienteListItem[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const sp: Record<string, string> = {};
  if (q) sp.q = q;
  if (ordem) sp.ordem = ordem;
  if (dir) sp.dir = dir;
  if (sexo) sp.sexo = sexo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalItems} paciente{totalItems !== 1 ? "s" : ""} cadastrado{totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/pacientes/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo paciente
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchInput basePath="/pacientes" placeholder="Buscar por nome, CPF ou telefone..." ariaLabel="Buscar pacientes" defaultValue={q} />
        </div>
        <PacienteFilters currentSexo={sexo ?? ""} />
      </div>

      {/* Table */}
      {items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  CPF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
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
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/pacientes/${p.id}`} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
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
                    {p.telefone ? formatPhone(p.telefone) : "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {p.data_nascimento ? formatDate(p.data_nascimento) : "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/pacientes/${p.id}`}
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
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <svg aria-hidden="true" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
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
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
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

