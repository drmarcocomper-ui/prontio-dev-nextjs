import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { getMedicoId } from "@/lib/clinica";
import { uuidValido } from "@/lib/validators";
import { ExameForm } from "./exame-form";

export const metadata: Metadata = { title: "Nova Solicitação de Exame" };

export default async function NovaSolicitacaoExamePage({
  searchParams,
}: {
  searchParams: Promise<{ paciente_id?: string; paciente_nome?: string }>;
}) {
  const { paciente_id: rawPacienteId, paciente_nome } = await searchParams;
  const medicoId = await getMedicoId();

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
                { label: "Nova solicitação de exame" },
              ]
            : [
                { label: "Exames", href: "/exames" },
                { label: "Nova solicitação" },
              ]
        } />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Nova solicitação de exame
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <ExameForm
          medicoId={medicoId}
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
