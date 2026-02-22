import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { LaudoForm } from "../../novo/laudo-form";
import type { LaudoComPaciente } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Laudo" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("laudos")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)?.pacientes?.nome;
  return { title: nome ? `Editar Laudo - ${nome}` : "Editar Laudo" };
}

export default async function EditarLaudoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: laudo } = await supabase
    .from("laudos")
    .select(
      "id, data, conteudo, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!laudo) {
    notFound();
  }

  const l = laudo as unknown as LaudoComPaciente;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: l.pacientes.nome, href: `/pacientes/${l.pacientes.id}` },
          { label: "Editar laudo" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar laudo
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <LaudoForm
          defaults={{
            id: l.id,
            paciente_id: l.pacientes.id,
            paciente_nome: l.pacientes.nome,
            data: l.data,
            conteudo: l.conteudo,
            observacoes: l.observacoes,
          }}
        />
      </div>
    </div>
  );
}
