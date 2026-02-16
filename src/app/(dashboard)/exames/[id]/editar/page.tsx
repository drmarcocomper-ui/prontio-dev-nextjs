import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getMedicoId } from "@/lib/clinica";
import { ExameForm } from "../../novo/exame-form";
import type { ExameComPaciente } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Solicitação de Exame" };
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { title: "Editar Solicitação de Exame" };
  }
  const { data } = await supabase
    .from("solicitacoes_exames")
    .select("pacientes(nome)")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)?.pacientes?.nome;
  return { title: nome ? `Editar Exame - ${nome}` : "Editar Solicitação de Exame" };
}

export default async function EditarExamePage({
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

  const { data: exame } = await supabase
    .from("solicitacoes_exames")
    .select(
      "id, data, tipo, exames, indicacao_clinica, operadora, numero_carteirinha, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  if (!exame) {
    notFound();
  }

  const e = exame as unknown as ExameComPaciente;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: e.pacientes.nome, href: `/pacientes/${e.pacientes.id}` },
          { label: "Editar solicitação de exame" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar solicitação de exame
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <ExameForm
          medicoId={medicoId}
          defaults={{
            id: e.id,
            paciente_id: e.pacientes.id,
            paciente_nome: e.pacientes.nome,
            data: e.data,
            tipo: e.tipo,
            exames: e.exames,
            indicacao_clinica: e.indicacao_clinica,
            operadora: e.operadora,
            numero_carteirinha: e.numero_carteirinha,
            observacoes: e.observacoes,
          }}
        />
      </div>
    </div>
  );
}
