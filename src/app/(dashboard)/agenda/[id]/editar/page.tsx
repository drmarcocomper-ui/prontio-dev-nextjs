import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getMedicoId, getClinicaAtual } from "@/lib/clinica";
import { AgendamentoForm } from "../../novo/agendamento-form";
import { type Agendamento } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Agendamento" };
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { title: "Editar Agendamento" };
  const { data } = await supabase
    .from("agendamentos")
    .select("pacientes(nome)")
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)?.pacientes?.nome;
  return { title: nome ? `Editar Agendamento - ${nome}` : "Editar Agendamento" };
}

export default async function EditarAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) notFound();

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select(
      "id, data, hora_inicio, hora_fim, tipo, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();

  if (!agendamento) {
    notFound();
  }

  const ag = agendamento as unknown as Agendamento;
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    notFound();
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Agenda", href: "/agenda" },
          { label: ag.pacientes.nome, href: `/agenda/${ag.id}` },
          { label: "Editar" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar agendamento
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <AgendamentoForm
          medicoId={medicoId}
          defaults={{
            id: ag.id,
            paciente_id: ag.pacientes.id,
            paciente_nome: ag.pacientes.nome,
            data: ag.data,
            hora_inicio: ag.hora_inicio.slice(0, 5),
            hora_fim: ag.hora_fim.slice(0, 5),
            tipo: ag.tipo,
            observacoes: ag.observacoes,
          }}
        />
      </div>
    </div>
  );
}
