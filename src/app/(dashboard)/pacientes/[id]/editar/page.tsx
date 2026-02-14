import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getMedicoId } from "@/lib/clinica";
import { PacienteForm } from "../../novo/paciente-form";
import { type PacienteDefaults } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Paciente" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("pacientes")
    .select("nome")
    .eq("id", id)
    .single();
  return { title: data?.nome ? `Editar - ${data.nome}` : "Editar Paciente" };
}

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    notFound();
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select(
      "id, nome, cpf, rg, data_nascimento, sexo, estado_civil, telefone, email, cep, endereco, numero, complemento, bairro, cidade, estado, convenio, observacoes"
    )
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single<PacienteDefaults>();

  if (!paciente) {
    notFound();
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: paciente.nome ?? "Paciente", href: `/pacientes/${paciente.id}` },
          { label: "Editar" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar paciente
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <PacienteForm defaults={paciente} />
      </div>
    </div>
  );
}
