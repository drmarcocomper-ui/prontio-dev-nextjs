import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { PrintButton } from "./print-button";
import {
  type ReceitaImpressao,
  TIPO_LABELS_IMPRESSAO,
  formatDateMedium,
  formatCPF,
} from "../../types";
import { getClinicaAtual } from "@/lib/clinica";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("receitas")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Imprimir Receita - ${nome}` : "Imprimir Receita" };
}

export default async function ImprimirReceitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: receita } = await supabase
    .from("receitas")
    .select("id, data, tipo, medicamentos, observacoes, pacientes(id, nome, cpf)")
    .eq("id", id)
    .single();

  if (!receita) {
    notFound();
  }

  const r = receita as unknown as ReceitaImpressao;

  const ctx = await getClinicaAtual();

  const [{ data: clinica }, { data: profConfigs }] = await Promise.all([
    ctx?.clinicaId
      ? supabase
          .from("clinicas")
          .select("nome, endereco, telefone")
          .eq("id", ctx.clinicaId)
          .single()
      : { data: null },
    supabase
      .from("configuracoes")
      .select("chave, valor")
      .in("chave", ["nome_profissional", "especialidade", "crm"]),
  ]);

  const cfg: Record<string, string> = {};
  if (clinica) {
    const c = clinica as { nome: string; endereco: string | null; telefone: string | null };
    cfg.nome_consultorio = c.nome;
    cfg.endereco_consultorio = c.endereco ?? "";
    cfg.telefone_consultorio = c.telefone ?? "";
  }
  (profConfigs ?? []).forEach((c: { chave: string; valor: string }) => {
    cfg[c.chave] = c.valor;
  });

  return (
    <div className="mx-auto max-w-2xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
              @page { margin: 20mm; }
            }
          `,
        }}
      />

      {/* Print Button */}
      <div className="no-print mb-6 flex items-center justify-between">
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: r.pacientes.nome, href: `/pacientes/${r.pacientes.id}` },
          { label: "Imprimir receita" },
        ]} />
        <PrintButton />
      </div>

      {/* Receita */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8">
        {/* Header Consultório */}
        <div className="border-b border-gray-300 pb-6 text-center">
          {cfg.nome_consultorio && (
            <h1 className="text-xl font-bold text-gray-900">
              {cfg.nome_consultorio}
            </h1>
          )}
          {cfg.endereco_consultorio && (
            <p className="mt-1 text-sm text-gray-600">
              {cfg.endereco_consultorio}
            </p>
          )}
          {cfg.telefone_consultorio && (
            <p className="text-sm text-gray-600">
              Tel: {cfg.telefone_consultorio}
            </p>
          )}
        </div>

        {/* Tipo da receita */}
        <div className="mt-6 text-center">
          <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900">
            {TIPO_LABELS_IMPRESSAO[r.tipo] ?? r.tipo}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{formatDateMedium(r.data)}</p>
        </div>

        {/* Dados do Paciente */}
        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Paciente:</span> {r.pacientes.nome}
          </p>
          {r.pacientes.cpf && (
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-semibold">CPF:</span>{" "}
              {formatCPF(r.pacientes.cpf)}
            </p>
          )}
        </div>

        {/* Medicamentos */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Medicamentos
          </h3>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {r.medicamentos}
          </div>
        </div>

        {/* Observações */}
        {r.observacoes && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Observações
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {r.observacoes}
            </p>
          </div>
        )}

        {/* Assinatura */}
        <div className="mt-12 border-t border-gray-300 pt-6 text-center">
          <div className="mx-auto w-64 border-b border-gray-400 pb-2" />
          {cfg.nome_profissional && (
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {cfg.nome_profissional}
            </p>
          )}
          {cfg.especialidade && (
            <p className="text-sm text-gray-600">{cfg.especialidade}</p>
          )}
          {cfg.crm && (
            <p className="text-sm text-gray-600">CRM: {cfg.crm}</p>
          )}
        </div>
      </div>
    </div>
  );
}
