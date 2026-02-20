import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { DeleteButton } from "@/components/delete-button";
import { getMedicoId } from "@/lib/clinica";
import { excluirProntuario } from "../actions";
import { type Prontuario, TIPO_LABELS, formatDateLong, getInitials } from "../types";
import { formatDateTime } from "@/lib/format";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Prontuário" };
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { title: "Prontuário" };
  }
  const { data } = await supabase
    .from("prontuarios")
    .select("pacientes(nome)")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Prontuário - ${nome}` : "Prontuário" };
}

function Section({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  if (!content) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
        {content}
      </p>
    </div>
  );
}

export default async function ProntuarioDetalhesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    notFound();
  }

  const { data: prontuario } = await supabase
    .from("prontuarios")
    .select(
      "id, data, tipo, cid, queixa_principal, historia_doenca, exame_fisico, hipotese_diagnostica, conduta, observacoes, created_at, updated_at, pacientes(id, nome)"
    )
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  if (!prontuario) {
    notFound();
  }

  const p = prontuario as unknown as Prontuario;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={
        from === "paciente"
          ? [
              { label: "Pacientes", href: "/pacientes" },
              { label: p.pacientes.nome, href: `/pacientes/${p.pacientes.id}` },
              { label: "Prontuário" },
            ]
          : [
              { label: "Prontuários", href: "/prontuarios" },
              { label: p.pacientes.nome },
            ]
      } />

      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
            {getInitials(p.pacientes.nome)}
          </div>
          <div>
            <Link
              href={`/pacientes/${p.pacientes.id}`}
              className="text-lg font-bold text-gray-900 hover:text-primary-600"
            >
              {p.pacientes.nome}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="capitalize">{formatDateLong(p.data)}</span>
              {p.tipo && (
                <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                  {TIPO_LABELS[p.tipo] ?? p.tipo}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/receitas/novo?paciente_id=${p.pacientes.id}&paciente_nome=${encodeURIComponent(p.pacientes.nome)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            Gerar Receita
          </Link>
          <Link
            href={`/atestados/novo?paciente_id=${p.pacientes.id}&paciente_nome=${encodeURIComponent(p.pacientes.nome)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition-colors hover:bg-amber-100"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Gerar Atestado
          </Link>
          <Link
            href={`/prontuarios/${p.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton onDelete={excluirProntuario.bind(null, p.id)} title="Excluir prontuário" description="Tem certeza que deseja excluir este prontuário? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir prontuário. Tente novamente." />
        </div>
      </div>

      {/* Evolução */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Evolução
        </h2>

        <div className="space-y-4 divide-y divide-gray-100">
          <Section title="Evolução" content={p.queixa_principal} />
          {/* Campos legados — exibidos apenas para registros antigos */}
          <div className="pt-4 first:pt-0">
            <Section title="História da doença atual" content={p.historia_doenca} />
          </div>
          <div className="pt-4 first:pt-0">
            <Section title="Exame físico" content={p.exame_fisico} />
          </div>
          <div className="pt-4 first:pt-0">
            <Section title="Hipótese diagnóstica" content={p.hipotese_diagnostica} />
          </div>
          <div className="pt-4 first:pt-0">
            <Section title="Conduta" content={p.conduta} />
          </div>
          <div className="pt-4 first:pt-0">
            <Section title="Observações" content={p.observacoes} />
          </div>
        </div>

        {!p.queixa_principal &&
          !p.historia_doenca &&
          !p.exame_fisico &&
          !p.hipotese_diagnostica &&
          !p.conduta &&
          !p.observacoes && (
            <p className="py-4 text-center text-sm text-gray-400">
              Nenhuma informação registrada.
            </p>
          )}
      </div>

      {/* Footer info */}
      <p className="text-xs text-gray-400">
        Registro criado em {formatDateTime(p.created_at)}
        {p.updated_at && (
          <>
            {" · Última atualização em "}
            {formatDateTime(p.updated_at)}
          </>
        )}
      </p>
    </div>
  );
}
