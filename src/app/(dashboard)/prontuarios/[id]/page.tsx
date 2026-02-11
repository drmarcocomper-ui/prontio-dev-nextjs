import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "./delete-button";

interface Prontuario {
  id: string;
  data: string;
  tipo: string | null;
  cid: string | null;
  queixa_principal: string | null;
  historia_doenca: string | null;
  exame_fisico: string | null;
  hipotese_diagnostica: string | null;
  conduta: string | null;
  observacoes: string | null;
  created_at: string;
  pacientes: {
    id: string;
    nome: string;
  };
}

const TIPO_LABELS: Record<string, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  avaliacao: "Avaliação",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prontuario } = await supabase
    .from("prontuarios")
    .select(
      "id, data, tipo, cid, queixa_principal, historia_doenca, exame_fisico, hipotese_diagnostica, conduta, observacoes, created_at, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!prontuario) {
    notFound();
  }

  const p = prontuario as unknown as Prontuario;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/prontuarios"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Prontuários
      </Link>

      {/* Header Card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
            {getInitials(p.pacientes.nome)}
          </div>
          <div>
            <Link
              href={`/pacientes/${p.pacientes.id}`}
              className="text-lg font-bold text-gray-900 hover:text-sky-600"
            >
              {p.pacientes.nome}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="capitalize">{formatDate(p.data)}</span>
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
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/prontuarios/${p.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton prontuarioId={p.id} />
        </div>
      </div>

      {/* Evolução clínica */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Evolução clínica
        </h2>

        <div className="space-y-4 divide-y divide-gray-100">
          <Section title="Queixa principal" content={p.queixa_principal} />
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
        Registro criado em{" "}
        {new Date(p.created_at).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
