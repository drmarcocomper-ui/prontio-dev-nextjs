import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getMedicoId } from "@/lib/clinica";
import { ProntuarioForm } from "../../novo/prontuario-form";
import { type Prontuario } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Prontuário" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("prontuarios")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)?.pacientes?.nome;
  return { title: nome ? `Editar Prontuário - ${nome}` : "Editar Prontuário" };
}

export default async function EditarProntuarioPage({
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

  const { data: prontuario } = await supabase
    .from("prontuarios")
    .select(
      "id, data, tipo, cid, queixa_principal, historia_doenca, exame_fisico, hipotese_diagnostica, conduta, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  if (!prontuario) {
    notFound();
  }

  const p = prontuario as unknown as Prontuario;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Prontuários", href: "/prontuarios" },
          { label: p.pacientes.nome, href: `/prontuarios/${p.id}` },
          { label: "Editar" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar evolução
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <ProntuarioForm
          medicoId={medicoId}
          defaults={{
            id: p.id,
            paciente_id: p.pacientes.id,
            paciente_nome: p.pacientes.nome,
            data: p.data,
            tipo: p.tipo,
            cid: p.cid,
            queixa_principal: p.queixa_principal,
            historia_doenca: p.historia_doenca,
            exame_fisico: p.exame_fisico,
            hipotese_diagnostica: p.hipotese_diagnostica,
            conduta: p.conduta,
            observacoes: p.observacoes,
          }}
        />
      </div>
    </div>
  );
}
