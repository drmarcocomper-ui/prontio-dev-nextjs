import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PacienteForm } from "../../novo/paciente-form";
import { type PacienteDefaults } from "../../types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
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

  const { data: paciente } = await supabase
    .from("pacientes")
    .select(
      "id, nome, cpf, rg, data_nascimento, sexo, estado_civil, telefone, email, cep, endereco, numero, complemento, bairro, cidade, estado, convenio, observacoes"
    )
    .eq("id", id)
    .single<PacienteDefaults>();

  if (!paciente) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/pacientes/${paciente.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar para {paciente.nome}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar paciente
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <PacienteForm defaults={paciente} />
      </div>
    </div>
  );
}
