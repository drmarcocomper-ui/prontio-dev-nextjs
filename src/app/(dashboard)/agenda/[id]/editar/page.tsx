import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendamentoForm } from "../../novo/agendamento-form";
import { type Agendamento } from "../../types";

export const metadata: Metadata = { title: "Editar Agendamento" };

export default async function EditarAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select(
      "id, data, hora_inicio, hora_fim, tipo, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!agendamento) {
    notFound();
  }

  const ag = agendamento as unknown as Agendamento;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/agenda/${ag.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar para agendamento
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar agendamento
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <AgendamentoForm
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
