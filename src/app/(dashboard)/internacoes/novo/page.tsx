import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { uuidValido } from "@/lib/validators";
import { InternacaoForm } from "./internacao-form";

export const metadata: Metadata = { title: "Nova Internação" };

export default async function NovaInternacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente_id?: string; paciente_nome?: string }>;
}) {
  const { paciente_id: rawPacienteId, paciente_nome } = await searchParams;

  const paciente_id = rawPacienteId && uuidValido(rawPacienteId) ? rawPacienteId : undefined;

  if (!paciente_id) {
    redirect("/pacientes");
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: paciente_nome ?? "Paciente", href: `/pacientes/${paciente_id}` },
          { label: "Nova internação" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Nova internação
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <InternacaoForm
          defaults={{ paciente_id, paciente_nome }}
          cancelHref={`/pacientes/${paciente_id}`}
        />
      </div>
    </div>
  );
}
