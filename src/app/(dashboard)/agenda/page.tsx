import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DatePicker } from "./date-picker";
import { StatusSelect, getStatusBadge } from "./status-select";

interface Agendamento {
  id: string;
  paciente_id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  tipo: string | null;
  status: string;
  observacoes: string | null;
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

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data: dataParam } = await searchParams;
  const currentDate = dataParam || new Date().toISOString().split("T")[0];

  const supabase = await createClient();

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("id, paciente_id, data, hora_inicio, hora_fim, tipo, status, observacoes, pacientes(id, nome, telefone)")
    .eq("data", currentDate)
    .order("hora_inicio");

  const items = (agendamentos ?? []) as unknown as Agendamento[];
  const total = items.length;
  const atendidos = items.filter((a) => a.status === "atendido").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} agendamento{total !== 1 ? "s" : ""}
            {total > 0 && ` \u00b7 ${atendidos} atendido${atendidos !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href={`/agenda/novo?data=${currentDate}`}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo agendamento
        </Link>
      </div>

      {/* Date Navigation */}
      <DatePicker currentDate={currentDate} />

      {/* Appointments List */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((ag) => (
            <div
              key={ag.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
            >
              {/* Time */}
              <div className="w-24 shrink-0 text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(ag.hora_inicio)}
                </p>
                <p className="text-xs text-gray-500">
                  até {formatTime(ag.hora_fim)}
                </p>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-gray-200" />

              {/* Patient Info */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  {getInitials(ag.pacientes.nome)}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/pacientes/${ag.pacientes.id}`}
                    className="block truncate text-sm font-medium text-gray-900 hover:text-sky-600"
                  >
                    {ag.pacientes.nome}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {ag.tipo && (
                      <span>{TIPO_LABELS[ag.tipo] ?? ag.tipo}</span>
                    )}
                    {ag.tipo && ag.observacoes && <span>&middot;</span>}
                    {ag.observacoes && (
                      <span className="truncate">{ag.observacoes}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge (mobile) */}
              <div className="hidden sm:block">
                {getStatusBadge(ag.status)}
              </div>

              {/* Status Select */}
              <div className="shrink-0">
                <StatusSelect agendamentoId={ag.id} currentStatus={ag.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            Nenhum agendamento para este dia
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Agende uma consulta para começar.
          </p>
          <Link
            href={`/agenda/novo?data=${currentDate}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo agendamento
          </Link>
        </div>
      )}
    </div>
  );
}
