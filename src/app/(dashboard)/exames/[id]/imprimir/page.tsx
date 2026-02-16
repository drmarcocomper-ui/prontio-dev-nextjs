import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { PrintActions } from "./print-button";
import {
  type ExameImpressao,
  formatDateMedium,
  formatCPF,
  parseExames,
} from "../../types";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Imprimir Solicitação de Exame" };
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { title: "Imprimir Solicitação de Exame" };
  }
  const { data } = await supabase
    .from("solicitacoes_exames")
    .select("pacientes(nome)")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Imprimir Exame - ${nome}` : "Imprimir Solicitação de Exame" };
}

export default async function ImprimirExamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ formato?: string }>;
}) {
  const { id } = await params;
  const { formato: formatoParam } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    notFound();
  }

  const supabase = await createClient();

  const { data: exame } = await supabase
    .from("solicitacoes_exames")
    .select("id, data, tipo, exames, indicacao_clinica, operadora, numero_carteirinha, observacoes, pacientes(id, nome, cpf)")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  if (!exame) {
    notFound();
  }

  const e = exame as unknown as ExameImpressao;
  const formato = formatoParam === "sadt" || formatoParam === "particular"
    ? formatoParam
    : e.tipo === "convenio" ? "sadt" : "particular";

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

      {/* Actions Bar */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: e.pacientes.nome, href: `/pacientes/${e.pacientes.id}` },
          { label: "Imprimir exame" },
        ]} />
        <PrintActions id={e.id} defaultFormato={formato} />
      </div>

      {formato === "particular" ? (
        <ParticularFormat e={e} cfg={cfg} />
      ) : (
        <SADTFormat e={e} cfg={cfg} />
      )}
    </div>
  );
}

function ParticularFormat({ e, cfg }: { e: ExameImpressao; cfg: Record<string, string> }) {
  const { items, freeText } = parseExames(e.exames);

  return (
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

      {/* Título */}
      <div className="mt-6 text-center">
        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900">
          Solicitação de Exames
        </h2>
        <p className="mt-1 text-sm text-gray-500">{formatDateMedium(e.data)}</p>
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

      {/* Exames */}
      <div className="mt-6">
        <h3 className="mb-4 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Exames Solicitados
        </h3>
        <ExamesFormatted items={items} freeText={freeText} text={e.exames} />
      </div>

      {/* Indicação clínica */}
      {e.indicacao_clinica && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Indicação Clínica
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {e.indicacao_clinica}
          </p>
        </div>
      )}

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
  );
}

function SADTFormat({ e, cfg }: { e: ExameImpressao; cfg: Record<string, string> }) {
  const { items, freeText } = parseExames(e.exames);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8">
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-4 text-center">
        <h1 className="text-lg font-bold uppercase tracking-wider text-gray-900">
          Guia de Solicitação — SP/SADT
        </h1>
      </div>

      {/* Dados do Beneficiário */}
      <div className="mt-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Dados do Beneficiário
        </h3>
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <span className="text-xs font-medium text-gray-500">Nome:</span>
              <p className="text-sm font-medium text-gray-900">{e.pacientes.nome}</p>
            </div>
            {e.numero_carteirinha && (
              <div>
                <span className="text-xs font-medium text-gray-500">N° Carteirinha:</span>
                <p className="text-sm font-medium text-gray-900">{e.numero_carteirinha}</p>
              </div>
            )}
            {e.operadora && (
              <div>
                <span className="text-xs font-medium text-gray-500">Operadora:</span>
                <p className="text-sm font-medium text-gray-900">{e.operadora}</p>
              </div>
            )}
            {e.pacientes.cpf && (
              <div>
                <span className="text-xs font-medium text-gray-500">CPF:</span>
                <p className="text-sm font-medium text-gray-900">{formatCPF(e.pacientes.cpf)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dados do Solicitante */}
      <div className="mt-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Dados do Solicitante
        </h3>
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {cfg.nome_profissional && (
              <div>
                <span className="text-xs font-medium text-gray-500">Profissional:</span>
                <p className="text-sm font-medium text-gray-900">{cfg.nome_profissional}</p>
              </div>
            )}
            {cfg.crm && (
              <div>
                <span className="text-xs font-medium text-gray-500">CRM:</span>
                <p className="text-sm font-medium text-gray-900">{cfg.crm}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-gray-500">Data:</span>
              <p className="text-sm font-medium text-gray-900">{formatDateMedium(e.data)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Procedimentos */}
      <div className="mt-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Procedimentos Solicitados
        </h3>
        {items.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">N°</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">Exame</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">Cód. TUSS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">{i + 1}</td>
                  <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">{item.nome}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600">{item.codigoTuss ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {e.exames}
            </p>
          </div>
        )}
        {freeText.length > 0 && (
          <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
            {freeText.join("\n")}
          </div>
        )}
      </div>

      {/* Indicação Clínica */}
      {e.indicacao_clinica && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Indicação Clínica
          </h3>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {e.indicacao_clinica}
            </p>
          </div>
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
        </div>
      </div>
    </div>
  );
}

function ExamesFormatted({ items, freeText, text }: { items: { nome: string; codigoTuss: string | null }[]; freeText: string[]; text: string }) {
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
              {item.codigoTuss && (
                <p className="mt-0.5 text-xs text-gray-500">
                  TUSS: {item.codigoTuss}
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
