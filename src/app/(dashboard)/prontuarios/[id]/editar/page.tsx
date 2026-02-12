import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProntuarioForm } from "../../novo/prontuario-form";
import { type Prontuario } from "../../types";

export default async function EditarProntuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prontuario } = await supabase
    .from("prontuarios")
    .select(
      "id, data, tipo, cid, queixa_principal, historia_doenca, exame_fisico, hipotese_diagnostica, conduta, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!prontuario) {
    notFound();
  }

  const p = prontuario as unknown as Prontuario;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/prontuarios/${p.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar para prontuário
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar evolução
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <ProntuarioForm
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
