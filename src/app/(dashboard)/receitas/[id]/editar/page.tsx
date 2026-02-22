import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { ReceitaForm } from "../../novo/receita-form";
import type { ReceitaComPaciente } from "../../types";
import { getClinicaAtual } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Receita" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("receitas")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)?.pacientes?.nome;
  return { title: nome ? `Editar Receita - ${nome}` : "Editar Receita" };
}

export default async function EditarReceitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getClinicaAtual();
  if (!ctx) notFound();

  const supabase = await createClient();

  const { data: receita } = await supabase
    .from("receitas")
    .select(
      "id, data, tipo, medicamentos, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!receita) {
    notFound();
  }

  const r = receita as unknown as ReceitaComPaciente;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: r.pacientes.nome, href: `/pacientes/${r.pacientes.id}` },
          { label: "Editar receita" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar receita
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <ReceitaForm
          defaults={{
            id: r.id,
            paciente_id: r.pacientes.id,
            paciente_nome: r.pacientes.nome,
            data: r.data,
            tipo: r.tipo,
            medicamentos: r.medicamentos,
            observacoes: r.observacoes,
          }}
        />
      </div>
    </div>
  );
}
