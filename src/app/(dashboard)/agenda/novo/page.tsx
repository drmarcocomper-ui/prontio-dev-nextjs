import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { todayLocal } from "@/lib/date";
import { AgendamentoForm } from "./agendamento-form";

export const metadata: Metadata = { title: "Novo Agendamento" };

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; hora?: string }>;
}) {
  const { data, hora } = await searchParams;
  const defaultDate = data || todayLocal();

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Agenda", href: `/agenda?data=${defaultDate}` },
          { label: "Novo agendamento" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Novo agendamento
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <AgendamentoForm defaultDate={defaultDate} defaultTime={hora} />
      </div>
    </div>
  );
}
