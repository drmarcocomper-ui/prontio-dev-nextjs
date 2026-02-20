import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { AtestadoForm } from "../../novo/atestado-form";
import type { AtestadoComPaciente } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Atestado" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("atestados")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)?.pacientes?.nome;
  return { title: nome ? `Editar Atestado - ${nome}` : "Editar Atestado" };
}

export default async function EditarAtestadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: atestado } = await supabase
    .from("atestados")
    .select(
      "id, data, tipo, conteudo, cid, dias_afastamento, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!atestado) {
    notFound();
  }

  const a = atestado as unknown as AtestadoComPaciente;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: a.pacientes.nome, href: `/pacientes/${a.pacientes.id}` },
          { label: "Editar atestado" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar atestado
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <AtestadoForm
          defaults={{
            id: a.id,
            paciente_id: a.pacientes.id,
            paciente_nome: a.pacientes.nome,
            data: a.data,
            tipo: a.tipo,
            conteudo: a.conteudo,
            cid: a.cid,
            dias_afastamento: a.dias_afastamento,
            observacoes: a.observacoes,
          }}
        />
      </div>
    </div>
  );
}
