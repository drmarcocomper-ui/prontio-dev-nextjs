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
import { CONVENIO_LABELS } from "@/app/(dashboard)/pacientes/types";
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
  searchParams: Promise<{
    formato?: string;
    operadora?: string;
    carteirinha?: string;
    registro_ans?: string;
  }>;
}) {
  const { id } = await params;
  const { formato: formatoParam, operadora: opParam, carteirinha: cartParam, registro_ans: ansParam } = await searchParams;
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
    .select("id, data, exames, indicacao_clinica, observacoes, pacientes(id, nome, cpf, convenio)")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  if (!exame) {
    notFound();
  }

  const e = exame as unknown as ExameImpressao;
  const formato = formatoParam === "sadt" || formatoParam === "particular"
    ? formatoParam
    : "particular";

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

  // Convênio label from patient's convenio
  const convenioLabel = e.pacientes.convenio
    ? (CONVENIO_LABELS[e.pacientes.convenio as keyof typeof CONVENIO_LABELS] ?? e.pacientes.convenio)
    : "";

  // SADT fields from searchParams (filled at print time, not saved)
  const sadtOperadora = opParam ?? convenioLabel;
  const sadtCarteirinha = cartParam ?? "";
  const sadtRegistroANS = ansParam ?? "";

  return (
    <div className="mx-auto max-w-3xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
              @page { margin: 15mm; }
            }
          `,
        }}
      />

      {/* Actions Bar */}
      <div className="no-print mb-6 space-y-4">
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: e.pacientes.nome, href: `/pacientes/${e.pacientes.id}` },
          { label: "Imprimir exame" },
        ]} />
        <PrintActions
          id={e.id}
          defaultFormato={formato}
          defaultOperadora={convenioLabel}
          defaultCarteirinha={sadtCarteirinha}
          defaultRegistroANS={sadtRegistroANS}
        />
      </div>

      {formato === "particular" ? (
        <ParticularFormat e={e} cfg={cfg} />
      ) : (
        <SADTFormat
          e={e}
          cfg={cfg}
          operadora={sadtOperadora}
          carteirinha={sadtCarteirinha}
          registroANS={sadtRegistroANS}
        />
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

function SADTFormat({
  e,
  cfg,
  operadora,
  carteirinha,
  registroANS,
}: {
  e: ExameImpressao;
  cfg: Record<string, string>;
  operadora: string;
  carteirinha: string;
  registroANS: string;
}) {
  const { items, freeText } = parseExames(e.exames);
  const allItems = items.length > 0
    ? items
    : e.exames.split("\n").filter((l) => l.trim()).map((l) => ({ nome: l.trim(), codigoTuss: null }));

  return (
    <div className="bg-white p-1">
      {/* SADT Grid Layout */}
      <table className="w-full border-collapse text-[11px] leading-tight" style={{ borderSpacing: 0 }}>
        <tbody>
          {/* Title Row */}
          <tr>
            <td colSpan={6} className="border border-black px-2 py-1.5 text-center font-bold text-xs">
              GUIA DE SP/SADT
            </td>
          </tr>

          {/* Row: Registro ANS + Nº Guia */}
          <tr>
            <td colSpan={3} className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">1 - </span>
              <span className="text-[9px] text-gray-500">Registro ANS</span>
              <p className="mt-0.5 text-[11px] font-medium">{registroANS || ""}</p>
            </td>
            <td colSpan={3} className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">2 - </span>
              <span className="text-[9px] text-gray-500">N° Guia no Prestador</span>
              <p className="mt-0.5 text-[11px] font-medium">&nbsp;</p>
            </td>
          </tr>

          {/* Section: Dados do Beneficiário */}
          <tr>
            <td colSpan={6} className="border border-black bg-gray-100 px-2 py-1 font-bold text-[10px]">
              DADOS DO BENEFICIÁRIO
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">8 - </span>
              <span className="text-[9px] text-gray-500">N° da Carteira</span>
              <p className="mt-0.5 text-[11px] font-medium">{carteirinha || ""}</p>
            </td>
            <td colSpan={3} className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">10 - </span>
              <span className="text-[9px] text-gray-500">Nome</span>
              <p className="mt-0.5 text-[11px] font-medium">{e.pacientes.nome}</p>
            </td>
            <td className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">11 - </span>
              <span className="text-[9px] text-gray-500">CPF</span>
              <p className="mt-0.5 text-[11px] font-medium">{e.pacientes.cpf ? formatCPF(e.pacientes.cpf) : ""}</p>
            </td>
          </tr>

          {/* Section: Dados do Solicitante */}
          <tr>
            <td colSpan={6} className="border border-black bg-gray-100 px-2 py-1 font-bold text-[10px]">
              DADOS DO SOLICITANTE
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">13 - </span>
              <span className="text-[9px] text-gray-500">Código na Operadora / CNPJ</span>
              <p className="mt-0.5 text-[11px] font-medium">&nbsp;</p>
            </td>
            <td colSpan={3} className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">14 - </span>
              <span className="text-[9px] text-gray-500">Nome do Contratado</span>
              <p className="mt-0.5 text-[11px] font-medium">{operadora || cfg.nome_consultorio || ""}</p>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">15 - </span>
              <span className="text-[9px] text-gray-500">Nome do Profissional Solicitante</span>
              <p className="mt-0.5 text-[11px] font-medium">{cfg.nome_profissional || ""}</p>
            </td>
            <td className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">16 - </span>
              <span className="text-[9px] text-gray-500">Conselho</span>
              <p className="mt-0.5 text-[11px] font-medium">CRM</p>
            </td>
            <td className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">17 - </span>
              <span className="text-[9px] text-gray-500">N° no Conselho</span>
              <p className="mt-0.5 text-[11px] font-medium">{cfg.crm || ""}</p>
            </td>
            <td className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">18 - </span>
              <span className="text-[9px] text-gray-500">UF</span>
              <p className="mt-0.5 text-[11px] font-medium">&nbsp;</p>
            </td>
          </tr>

          {/* Section: Dados da Solicitação */}
          <tr>
            <td colSpan={6} className="border border-black bg-gray-100 px-2 py-1 font-bold text-[10px]">
              DADOS DA SOLICITAÇÃO / PROCEDIMENTOS SOLICITADOS
            </td>
          </tr>

          {/* Indicação Clínica */}
          <tr>
            <td colSpan={6} className="border border-black px-2 py-1">
              <span className="text-[9px] font-bold text-gray-500">21 - </span>
              <span className="text-[9px] text-gray-500">Indicação Clínica</span>
              <p className="mt-0.5 text-[11px] font-medium whitespace-pre-wrap">{e.indicacao_clinica || ""}</p>
            </td>
          </tr>

          {/* Procedures Table Header */}
          <tr>
            <td className="border border-black bg-gray-50 px-2 py-1 text-center font-bold text-[9px]">
              <span className="text-gray-500">22 - </span>Tab
            </td>
            <td colSpan={2} className="border border-black bg-gray-50 px-2 py-1 text-center font-bold text-[9px]">
              Cód. Procedimento
            </td>
            <td colSpan={2} className="border border-black bg-gray-50 px-2 py-1 font-bold text-[9px]">
              Descrição
            </td>
            <td className="border border-black bg-gray-50 px-2 py-1 text-center font-bold text-[9px]">
              Qtd
            </td>
          </tr>

          {/* Procedure Rows */}
          {allItems.map((item, i) => (
            <tr key={i}>
              <td className="border border-black px-2 py-1 text-center text-[10px]">
                {item.codigoTuss ? "22" : ""}
              </td>
              <td colSpan={2} className="border border-black px-2 py-1 text-center text-[10px]">
                {item.codigoTuss || ""}
              </td>
              <td colSpan={2} className="border border-black px-2 py-1 text-[10px]">
                {item.nome}
              </td>
              <td className="border border-black px-2 py-1 text-center text-[10px]">
                1
              </td>
            </tr>
          ))}

          {/* Free text if any */}
          {freeText.length > 0 && (
            <tr>
              <td colSpan={6} className="border border-black px-2 py-1 text-[10px]">
                <span className="text-[9px] text-gray-500">Obs: </span>
                {freeText.join("; ")}
              </td>
            </tr>
          )}

          {/* Observações */}
          {e.observacoes && (
            <tr>
              <td colSpan={6} className="border border-black px-2 py-1">
                <span className="text-[9px] font-bold text-gray-500">23 - </span>
                <span className="text-[9px] text-gray-500">Observações</span>
                <p className="mt-0.5 text-[10px] whitespace-pre-wrap">{e.observacoes}</p>
              </td>
            </tr>
          )}

          {/* Signature Row */}
          <tr>
            <td colSpan={2} className="border border-black px-2 py-1">
              <span className="text-[9px] text-gray-500">Data</span>
              <p className="mt-0.5 text-[11px] font-medium">{formatDateMedium(e.data)}</p>
            </td>
            <td colSpan={4} className="border border-black px-2 py-4 text-center">
              <div className="mt-4 flex flex-col items-center">
                <div className="w-56 border-b border-black" />
                <p className="mt-1 text-[10px]">
                  Assinatura do Profissional Solicitante
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
