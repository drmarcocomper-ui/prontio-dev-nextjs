import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "../status-badge";
import { DeleteButton } from "./delete-button";

interface Agendamento {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  tipo: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  pacientes: {
    id: string;
    nome: string;
    telefone: string | null;
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

function formatTime(time: string) {
  return time.slice(0, 5);
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

export default async function AgendamentoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select(
      "id, data, hora_inicio, hora_fim, tipo, status, observacoes, created_at, pacientes(id, nome, telefone)"
    )
    .eq("id", id)
    .single();

  if (!agendamento) {
    notFound();
  }

  const ag = agendamento as unknown as Agendamento;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <Link
        href={`/agenda?data=${ag.data}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Agenda
      </Link>

      {/* Header Card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
            {getInitials(ag.pacientes.nome)}
          </div>
          <div>
            <Link
              href={`/pacientes/${ag.pacientes.id}`}
              className="text-lg font-bold text-gray-900 hover:text-sky-600"
            >
              {ag.pacientes.nome}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="capitalize">{formatDate(ag.data)}</span>
              {ag.tipo && (
                <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                  {TIPO_LABELS[ag.tipo] ?? ag.tipo}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/agenda/${ag.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton agendamentoId={ag.id} data={ag.data} />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Detalhes do agendamento
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Horário
            </h3>
            <p className="mt-1 text-sm text-gray-800">
              {formatTime(ag.hora_inicio)} — {formatTime(ag.hora_fim)}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </h3>
            <div className="mt-1">
              <StatusBadge status={ag.status} />
            </div>
          </div>

          {ag.pacientes.telefone && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Telefone
              </h3>
              <p className="mt-1 text-sm text-gray-800">{ag.pacientes.telefone}</p>
            </div>
          )}
        </div>

        {ag.observacoes && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Observações
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {ag.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="text-xs text-gray-400">
        Registro criado em{" "}
        {new Date(ag.created_at).toLocaleString("pt-BR", {
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
