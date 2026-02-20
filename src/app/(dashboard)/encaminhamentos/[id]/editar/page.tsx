import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { EncaminhamentoForm } from "../../novo/encaminhamento-form";
import type { EncaminhamentoComPaciente } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Encaminhamento" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("encaminhamentos")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)?.pacientes?.nome;
  return { title: nome ? `Editar Encaminhamento - ${nome}` : "Editar Encaminhamento" };
}

export default async function EditarEncaminhamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: encaminhamento } = await supabase
    .from("encaminhamentos")
    .select(
      "id, data, profissional_destino, especialidade, telefone_profissional, motivo, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!encaminhamento) {
    notFound();
  }

  const e = encaminhamento as unknown as EncaminhamentoComPaciente;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: e.pacientes.nome, href: `/pacientes/${e.pacientes.id}` },
          { label: "Editar encaminhamento" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar encaminhamento
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <EncaminhamentoForm
          defaults={{
            id: e.id,
            paciente_id: e.pacientes.id,
            paciente_nome: e.pacientes.nome,
            data: e.data,
            profissional_destino: e.profissional_destino,
            especialidade: e.especialidade,
            telefone_profissional: e.telefone_profissional,
            motivo: e.motivo,
            observacoes: e.observacoes,
          }}
        />
      </div>
    </div>
  );
}
