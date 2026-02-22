import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { PrintButton } from "./print-button";
import {
  type LaudoImpressao,
  formatDateMedium,
  formatCPF,
} from "../../types";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Imprimir Laudo" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("laudos")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Imprimir Laudo - ${nome}` : "Imprimir Laudo" };
}

export default async function ImprimirLaudoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();

  const { data: laudo } = await supabase
    .from("laudos")
    .select("id, data, conteudo, observacoes, pacientes(id, nome, cpf)")
    .eq("id", id)
    .single();

  if (!laudo) {
    notFound();
  }

  const l = laudo as unknown as LaudoImpressao;

  const [ctx, medicoId] = await Promise.all([
    getClinicaAtual(),
    getMedicoId().catch(() => null),
  ]);

  const [{ data: clinica }, { data: profConfigs }] = await Promise.all([
    ctx?.clinicaId
      ? supabase
          .from("clinicas")
          .select("nome, endereco, telefone")
          .eq("id", ctx.clinicaId)
          .single()
      : { data: null },
    medicoId
      ? supabase
          .from("configuracoes")
          .select("chave, valor")
          .eq("user_id", medicoId)
          .in("chave", ["nome_profissional", "especialidade", "crm"])
      : { data: [] },
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
              @page { margin: 0; }
            }
          `,
        }}
      />

      {/* Print Button */}
      <div className="no-print mb-6 flex items-center justify-between">
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: l.pacientes.nome, href: `/pacientes/${l.pacientes.id}` },
          { label: "Imprimir laudo" },
        ]} />
        <PrintButton />
      </div>

      {/* Laudo */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 print:rounded-none print:border-0 print:shadow-none print:p-[20mm]">
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

        {/* Título */}
        <div className="mt-6 text-center">
          <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900">
            Laudo Médico
          </h2>
          {l.data && (
            <p className="mt-1 text-sm text-gray-500">{formatDateMedium(l.data)}</p>
          )}
        </div>

        {/* Dados do Paciente */}
        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Paciente:</span> {l.pacientes.nome}
          </p>
          {l.pacientes.cpf && (
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-semibold">CPF:</span>{" "}
              {formatCPF(l.pacientes.cpf)}
            </p>
          )}
        </div>

        {/* Conteúdo do laudo */}
        <div className="mt-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {l.conteudo}
          </p>
        </div>

        {/* Observações */}
        {l.observacoes && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Observações
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {l.observacoes}
            </p>
          </div>
        )}

        {/* Assinatura */}
        <div className="mt-16 flex flex-col items-center">
          <div className="w-72 border-b border-gray-900" />
          <div className="mt-3 text-center">
            {cfg.nome_profissional && (
              <p className="text-sm font-bold text-gray-900">
                {cfg.nome_profissional}
              </p>
            )}
            {cfg.crm && (
              <p className="mt-0.5 text-sm font-medium text-gray-700">
                CRM {cfg.crm}
              </p>
            )}
            {cfg.especialidade && (
              <p className="mt-0.5 text-xs text-gray-500">{cfg.especialidade}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
