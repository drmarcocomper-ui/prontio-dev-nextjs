import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { uuidValido } from "@/lib/validators";
import { ProntuarioForm } from "./prontuario-form";

export const metadata: Metadata = { title: "Nova Evolução" };

export default async function NovoProntuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente_id?: string; paciente_nome?: string }>;
}) {
  const { paciente_id: rawPacienteId, paciente_nome } = await searchParams;

  const paciente_id = rawPacienteId && uuidValido(rawPacienteId) ? rawPacienteId : undefined;
  const fromPaciente = !!paciente_id;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={
          fromPaciente
            ? [
                { label: "Pacientes", href: "/pacientes" },
                { label: paciente_nome ?? "Paciente", href: `/pacientes/${paciente_id}` },
                { label: "Nova evolução" },
              ]
            : [
                { label: "Prontuários", href: "/prontuarios" },
                { label: "Nova evolução" },
              ]
        } />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Nova evolução
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <ProntuarioForm
          defaults={
            paciente_id
              ? { paciente_id, paciente_nome }
              : undefined
          }
          cancelHref={fromPaciente ? `/pacientes/${paciente_id}` : undefined}
        />
      </div>
    </div>
  );
}
