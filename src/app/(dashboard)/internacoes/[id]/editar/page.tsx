import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { InternacaoForm } from "../../novo/internacao-form";
import type { InternacaoComPaciente } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Internação" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("internacoes")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)?.pacientes?.nome;
  return { title: nome ? `Editar Internação - ${nome}` : "Editar Internação" };
}

export default async function EditarInternacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: internacao } = await supabase
    .from("internacoes")
    .select(
      "id, data, hospital_nome, data_sugerida_internacao, carater_atendimento, tipo_internacao, regime_internacao, diarias_solicitadas, previsao_opme, previsao_quimioterapico, indicacao_clinica, cid_principal, cid_2, cid_3, cid_4, indicacao_acidente, procedimentos, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!internacao) {
    notFound();
  }

  const i = internacao as unknown as InternacaoComPaciente;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: i.pacientes.nome, href: `/pacientes/${i.pacientes.id}` },
          { label: "Editar internação" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar internação
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <InternacaoForm
          defaults={{
            id: i.id,
            paciente_id: i.pacientes.id,
            paciente_nome: i.pacientes.nome,
            data: i.data,
            hospital_nome: i.hospital_nome,
            data_sugerida_internacao: i.data_sugerida_internacao,
            carater_atendimento: i.carater_atendimento,
            tipo_internacao: i.tipo_internacao,
            regime_internacao: i.regime_internacao,
            diarias_solicitadas: i.diarias_solicitadas,
            previsao_opme: i.previsao_opme,
            previsao_quimioterapico: i.previsao_quimioterapico,
            indicacao_clinica: i.indicacao_clinica,
            cid_principal: i.cid_principal,
            cid_2: i.cid_2,
            cid_3: i.cid_3,
            cid_4: i.cid_4,
            indicacao_acidente: i.indicacao_acidente,
            procedimentos: i.procedimentos,
            observacoes: i.observacoes,
          }}
        />
      </div>
    </div>
  );
}
