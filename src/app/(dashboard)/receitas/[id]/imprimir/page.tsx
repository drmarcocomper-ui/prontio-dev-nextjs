import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

interface Receita {
  id: string;
  data: string;
  tipo: string;
  medicamentos: string;
  observacoes: string | null;
  pacientes: {
    nome: string;
    cpf: string | null;
  };
}

const TIPO_LABELS: Record<string, string> = {
  simples: "Receita Simples",
  especial: "Receita Especial",
  controle_especial: "Receita de Controle Especial",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
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
    .select("id, data, tipo, medicamentos, observacoes, pacientes(nome, cpf)")
    .eq("id", id)
    .single();

  if (!receita) {
    notFound();
  }

  const r = receita as unknown as Receita;

  const { data: configs } = await supabase
    .from("configuracoes")
    .select("chave, valor")
    .in("chave", [
      "nome_consultorio",
      "endereco_consultorio",
      "telefone_consultorio",
      "nome_profissional",
      "especialidade",
      "crm",
    ]);

  const cfg: Record<string, string> = {};
  (configs ?? []).forEach((c: { chave: string; valor: string }) => {
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
        <a
          href={`/receitas/${r.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar para receita
        </a>
        <PrintButton />
      </div>

      {/* Receita */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
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
            {TIPO_LABELS[r.tipo] ?? r.tipo}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{formatDate(r.data)}</p>
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
