import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getAuthEmailMap } from "@/lib/supabase/admin";
import { getClinicaAtual, isGestor } from "@/lib/clinica";
import { Pagination } from "@/components/pagination";
import { QueryError } from "@/components/query-error";
import { AuditFilters } from "./filters";
import {
  type AuditLog,
  type AuditLogWithEmail,
  ACAO_LABELS,
  RECURSO_LABELS,
  ACAO_BADGE,
} from "./types";

export const metadata: Metadata = { title: "Auditoria" };

const PAGE_SIZE = 20;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    pagina?: string;
    acao?: string;
    recurso?: string;
    data_inicio?: string;
    data_fim?: string;
  }>;
}) {
  const ctx = await getClinicaAtual();
  if (!ctx) redirect("/login");

  // Only superadmin and gestor can access
  if (!isGestor(ctx.papel)) redirect("/");

  const { pagina, acao, recurso, data_inicio, data_fim } = await searchParams;
  const currentPage = Math.max(1, Number(pagina) || 1);

  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .eq("clinica_id", ctx.clinicaId)
    .order("created_at", { ascending: false });

  if (acao) query = query.eq("acao", acao);
  if (recurso) query = query.eq("recurso", recurso);
  if (data_inicio) query = query.gte("created_at", `${data_inicio}T00:00:00`);
  if (data_fim) query = query.lte("created_at", `${data_fim}T23:59:59`);

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: logs, count, error } = await query;

  if (error) {
    return <QueryError title="Auditoria" />;
  }

  const items = (logs ?? []) as AuditLog[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // Resolve user_id → email
  const uniqueUserIds = [...new Set(items.map((l) => l.user_id))];
  let emailMap: Record<string, string> = {};
  try {
    const admin = createAdminClient();
    emailMap = await getAuthEmailMap(admin, uniqueUserIds);
  } catch {
    // If admin client fails, show user_id instead
  }

  const itemsWithEmail: AuditLogWithEmail[] = items.map((l) => ({
    ...l,
    user_email: emailMap[l.user_id] || l.user_id.slice(0, 8) + "...",
  }));

  const sp: Record<string, string> = {};
  if (acao) sp.acao = acao;
  if (recurso) sp.recurso = recurso;
  if (data_inicio) sp.data_inicio = data_inicio;
  if (data_fim) sp.data_fim = data_fim;

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalItems} registro{totalItems !== 1 ? "s" : ""} de atividade
        </p>
      </div>

      {/* Filters */}
      <AuditFilters
        currentAcao={acao ?? ""}
        currentRecurso={recurso ?? ""}
        currentDataInicio={data_inicio ?? ""}
        currentDataFim={data_fim ?? ""}
      />

      {/* Mobile Cards */}
      {itemsWithEmail.length > 0 ? (
        <>
          <div className="space-y-3 lg:hidden">
            {itemsWithEmail.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACAO_BADGE[log.acao] ?? "bg-gray-50 text-gray-700"}`}
                      >
                        {ACAO_LABELS[log.acao] ?? log.acao}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {RECURSO_LABELS[log.recurso] ?? log.recurso}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{log.user_email}</p>
                    {log.recurso_id && (
                      <p className="mt-0.5 text-xs text-gray-400 font-mono">
                        ID: {log.recurso_id.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
                {log.detalhes && Object.keys(log.detalhes).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                      Ver detalhes
                    </summary>
                    <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                      {JSON.stringify(log.detalhes, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Data/Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Usuário
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ação
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Recurso
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {itemsWithEmail.map((log) => (
                  <tr key={log.id} className="transition-colors even:bg-gray-50/50 hover:bg-primary-50/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {log.user_email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACAO_BADGE[log.acao] ?? "bg-gray-50 text-gray-700"}`}
                      >
                        {ACAO_LABELS[log.acao] ?? log.acao}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {RECURSO_LABELS[log.recurso] ?? log.recurso}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-400">
                      {log.recurso_id ? log.recurso_id.slice(0, 8) + "..." : "\u2014"}
                    </td>
                    <td className="max-w-xs px-6 py-4 text-sm text-gray-500">
                      {log.detalhes && Object.keys(log.detalhes).length > 0 ? (
                        <details>
                          <summary className="cursor-pointer hover:text-gray-700">
                            Ver detalhes
                          </summary>
                          <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                            {JSON.stringify(log.detalhes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            Nenhum registro encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {acao || recurso || data_inicio || data_fim
              ? "Tente ajustar os filtros."
              : "Os registros de auditoria aparecerão aqui conforme o sistema for utilizado."}
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        basePath="/auditoria"
        searchParams={sp}
      />
    </div>
  );
}
