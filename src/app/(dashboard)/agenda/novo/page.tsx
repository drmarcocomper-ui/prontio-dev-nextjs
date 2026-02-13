import type { Metadata } from "next";
import Link from "next/link";
import { todayLocal } from "@/lib/date";
import { AgendamentoForm } from "./agendamento-form";

export const metadata: Metadata = { title: "Novo Agendamento" };

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data } = await searchParams;
  const defaultDate = data || todayLocal();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/agenda?data=${defaultDate}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Agenda
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Novo agendamento
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <AgendamentoForm defaultDate={defaultDate} />
      </div>
    </div>
  );
}
