import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { PrintButton } from "./print-button";
import {
  type EncaminhamentoImpressao,
  formatDateMedium,
  formatCPF,
  formatPhone,
} from "../../types";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Imprimir Encaminhamento" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("encaminhamentos")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Imprimir Encaminhamento - ${nome}` : "Imprimir Encaminhamento" };
}

export default async function ImprimirEncaminhamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();

  const { data: encaminhamento } = await supabase
    .from("encaminhamentos")
    .select("id, data, profissional_destino, especialidade, telefone_profissional, motivo, observacoes, pacientes(id, nome, cpf)")
    .eq("id", id)
    .single();

  if (!encaminhamento) {
    notFound();
  }

  const e = encaminhamento as unknown as EncaminhamentoImpressao;

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
          { label: e.pacientes.nome, href: `/pacientes/${e.pacientes.id}` },
          { label: "Imprimir encaminhamento" },
        ]} />
        <PrintButton />
      </div>

      {/* Carta de Encaminhamento */}
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
            Carta de Encaminhamento
          </h2>
          {e.data && (
            <p className="mt-1 text-sm text-gray-500">{formatDateMedium(e.data)}</p>
          )}
        </div>

        {/* Dados do Paciente */}
        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Paciente:</span> {e.pacientes.nome}
          </p>
          {e.pacientes.cpf && (
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-semibold">CPF:</span>{" "}
              {formatCPF(e.pacientes.cpf)}
            </p>
          )}
        </div>

        {/* Destinatário */}
        <div className="mt-6">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">Ao(à) Dr(a). {e.profissional_destino}</span>
          </p>
          <p className="mt-1 text-sm text-gray-700">
            Especialidade: {e.especialidade}
          </p>
          {e.telefone_profissional && (
            <p className="mt-1 text-sm text-gray-700">
              Tel: {formatPhone(e.telefone_profissional)}
            </p>
          )}
        </div>

        {/* Motivo do encaminhamento */}
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Motivo do Encaminhamento
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {e.motivo}
          </p>
        </div>

        {/* Observações */}
        {e.observacoes && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Observações
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {e.observacoes}
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
