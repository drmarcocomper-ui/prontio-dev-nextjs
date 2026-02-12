import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReceitaForm } from "../../novo/receita-form";
import type { ReceitaComPaciente } from "../../types";

export default async function EditarReceitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/receitas/${r.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar para receita
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar receita
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
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
