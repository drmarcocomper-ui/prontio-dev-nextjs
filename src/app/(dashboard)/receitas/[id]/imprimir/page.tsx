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
  parseMedicamentos,
} from "../../types";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Imprimir Receita" };
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { title: "Imprimir Receita" };
  }
  const { data } = await supabase
    .from("receitas")
    .select("pacientes(nome)")
    .eq("id", id)
    .eq("medico_id", medicoId)
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
  if (!UUID_RE.test(id)) notFound();

  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    notFound();
  }

  const supabase = await createClient();

  const { data: receita } = await supabase
    .from("receitas")
    .select("id, data, tipo, medicamentos, observacoes, pacientes(id, nome, cpf)")
    .eq("id", id)
    .eq("medico_id", medicoId)
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
          <h3 className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Prescrição
          </h3>
          <MedicamentosFormatted text={r.medicamentos} />
        </div>

        {/* Observações */}
        {r.observacoes && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Observações
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {r.observacoes}
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

function MedicamentosFormatted({ text }: { text: string }) {
  const { items, freeText } = parseMedicamentos(text);

  if (items.length === 0) {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
        {text}
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4 py-3 first:pt-0">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.nome}</p>
              {item.detalhes && (
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {item.detalhes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {freeText.length > 0 && (
        <div className="mt-4 whitespace-pre-wrap border-t border-gray-200 pt-3 text-sm text-gray-700">
          {freeText.join("\n")}
        </div>
      )}
    </div>
  );
}
