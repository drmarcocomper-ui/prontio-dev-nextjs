import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getClinicaAtual } from "@/lib/clinica";
import { TransacaoForm } from "../../novo/transacao-form";
import { maskCurrency, type TransacaoFull } from "../../constants";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Transação" };
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { title: "Editar Transação" };
  const { data } = await supabase
    .from("transacoes")
    .select("descricao")
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();
  const descricao = (data as { descricao: string } | null)?.descricao;
  return { title: descricao ? `Editar - ${descricao}` : "Editar Transação" };
}

export default async function EditarTransacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) notFound();

  const { data: transacao } = await supabase
    .from("transacoes")
    .select(
      "id, tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();

  if (!transacao) {
    notFound();
  }

  const t = transacao as unknown as TransacaoFull;

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Financeiro", href: "/financeiro" },
          { label: t.descricao, href: `/financeiro/${t.id}` },
          { label: "Editar" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar transação
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <TransacaoForm
          defaults={{
            id: t.id,
            tipo: t.tipo,
            categoria: t.categoria,
            descricao: t.descricao,
            valor: maskCurrency(String(Math.round(t.valor * 100))),
            data: t.data,
            paciente_id: t.pacientes?.id ?? null,
            paciente_nome: t.pacientes?.nome ?? null,
            forma_pagamento: t.forma_pagamento,
            status: t.status,
            observacoes: t.observacoes,
          }}
        />
      </div>
    </div>
  );
}
