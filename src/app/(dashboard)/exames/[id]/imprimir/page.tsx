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
import { getClinicaAtual } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Imprimir Solicitação de Exame" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitacoes_exames")
    .select("pacientes(nome)")
    .eq("id", id)
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

  const supabase = await createClient();

  const { data: exame } = await supabase
    .from("solicitacoes_exames")
    .select("id, data, exames, indicacao_clinica, observacoes, pacientes(id, nome, cpf, convenio)")
    .eq("id", id)
    .single();

  if (!exame) {
    notFound();
  }

  const e = exame as unknown as ExameImpressao;
  const formato = formatoParam === "sadt" || formatoParam === "particular"
    ? formatoParam
    : "particular";

  const isSADT = formato === "sadt";

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
      .eq("user_id", ctx?.userId ?? "")
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

  const convenioLabel = e.pacientes.convenio
    ? (CONVENIO_LABELS[e.pacientes.convenio as keyof typeof CONVENIO_LABELS] ?? e.pacientes.convenio)
    : "";

  const sadtOperadora = opParam ?? convenioLabel;
  const sadtCarteirinha = cartParam ?? "";
  const sadtRegistroANS = ansParam ?? "";

  return (
    <div className={isSADT ? "mx-auto w-full" : "mx-auto max-w-3xl"}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              html, body { margin: 0 !important; padding: 0 !important; }
              ${isSADT ? `
              @page {
                size: A4 landscape;
                margin: 0;
              }
              .sadt-print-wrapper {
                padding: 8mm 10mm;
              }
              ` : `
              @page {
                size: A4 portrait;
                margin: 0;
              }
              .particular-print-wrapper {
                padding: 15mm 20mm;
              }
              `}
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

      {!isSADT ? (
        <div className="particular-print-wrapper">
          <ParticularFormat e={e} cfg={cfg} />
        </div>
      ) : (
        <div className="sadt-print-wrapper">
          <SADTFormat
            e={e}
            cfg={cfg}
            operadora={sadtOperadora}
            carteirinha={sadtCarteirinha}
            registroANS={sadtRegistroANS}
          />
        </div>
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
        {e.data && <p className="mt-1 text-sm text-gray-500">{formatDateMedium(e.data)}</p>}
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

/* ────────────────────────────────────────────────────────────
   SADT — Guia SP/SADT padrão ANS TISS
   Landscape A4, full width, numbered fields
   ──────────────────────────────────────────────────────────── */

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

  const c = "border border-black px-1 py-[2px] align-top"; // cell
  const sh = "border border-black bg-gray-200 px-1 py-[2px] text-[8px] font-bold tracking-wide"; // section header

  return (
    <div className="bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        .sadt { border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 8px; line-height: 1.2; }
        .sadt td { vertical-align: top; }
        .sadt .fn { color: #555; font-size: 7px; display: block; }
        .sadt .fn b { font-weight: 700; }
        .sadt .fv { font-size: 9px; min-height: 12px; }
      `}} />

      <table className="sadt">
        {/* 12-column grid for precise control */}
        <colgroup>
          {Array.from({ length: 12 }).map((_, i) => (
            <col key={i} style={{ width: `${100/12}%` }} />
          ))}
        </colgroup>
        <tbody>

          {/* ═══ TÍTULO ═══ */}
          <tr>
            <td colSpan={12} className="border border-black px-2 py-1 text-center">
              <b style={{ fontSize: 11, letterSpacing: 1 }}>GUIA DE SP/SADT</b>
            </td>
          </tr>

          {/* ═══ CAMPOS 1-6: IDENTIFICAÇÃO DA GUIA ═══ */}
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>1</b> - Registro ANS</span>
              <div className="fv">{registroANS}</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>2</b> - Nº Guia no Prestador</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>3</b> - Nº Guia Principal</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>4</b> - Data da Autorização</span>
              <div className="fv">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td colSpan={4} className={c}>
              <span className="fn"><b>5</b> - Senha</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={4} className={c}>
              <span className="fn"><b>6</b> - Data de Validade da Senha</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={4} className={c}>
              <span className="fn"><b>7</b> - Nº Guia Operadora</span>
              <div className="fv">&nbsp;</div>
            </td>
          </tr>

          {/* ═══ DADOS DO BENEFICIÁRIO ═══ */}
          <tr>
            <td colSpan={12} className={sh}>DADOS DO BENEFICIÁRIO</td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>8</b> - Número da Carteira</span>
              <div className="fv">{carteirinha}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>9</b> - Validade da Carteira</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={5} className={c}>
              <span className="fn"><b>10</b> - Nome do Beneficiário</span>
              <div className="fv">{e.pacientes.nome}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>11</b> - Cartão Nacional de Saúde</span>
              <div className="fv">{e.pacientes.cpf ? formatCPF(e.pacientes.cpf) : ""}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={12} className={c}>
              <span className="fn"><b>12</b> - Atendimento a RN</span>
              <div className="fv">N</div>
            </td>
          </tr>

          {/* ═══ DADOS DO SOLICITANTE ═══ */}
          <tr>
            <td colSpan={12} className={sh}>DADOS DO SOLICITANTE</td>
          </tr>
          <tr>
            <td colSpan={4} className={c}>
              <span className="fn"><b>13</b> - Código na Operadora/CNPJ</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={8} className={c}>
              <span className="fn"><b>14</b> - Nome do Contratado</span>
              <div className="fv">{operadora || cfg.nome_consultorio || ""}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={4} className={c}>
              <span className="fn"><b>15</b> - Nome do Profissional Solicitante</span>
              <div className="fv">{cfg.nome_profissional || ""}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>16</b> - Conselho</span>
              <div className="fv">CRM</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>17</b> - Nº no Conselho</span>
              <div className="fv">{cfg.crm || ""}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>18</b> - UF</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>19</b> - Código CBO-S</span>
              <div className="fv">&nbsp;</div>
            </td>
          </tr>

          {/* ═══ DADOS DA SOLICITAÇÃO ═══ */}
          <tr>
            <td colSpan={12} className={sh}>DADOS DA SOLICITAÇÃO / PROCEDIMENTOS E EXAMES SOLICITADOS</td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>21</b> - Caráter do Atendimento</span>
              <div className="fv">Eletiva</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>22</b> - Data da Solicitação</span>
              <div className="fv">{e.data ? formatDateMedium(e.data) : ""}</div>
            </td>
            <td colSpan={6} className={c}>
              <span className="fn"><b>23</b> - Indicação Clínica</span>
              <div className="fv whitespace-pre-wrap">{e.indicacao_clinica || ""}</div>
            </td>
          </tr>

          {/* Tabela de Procedimentos — Header */}
          <tr>
            <td colSpan={1} className="border border-black bg-gray-100 px-1 py-[2px] text-center text-[7px] font-bold">
              <span className="fn"><b>24</b></span>Tabela
            </td>
            <td colSpan={3} className="border border-black bg-gray-100 px-1 py-[2px] text-center text-[7px] font-bold">
              <span className="fn"><b>25</b></span>Código do Procedimento
            </td>
            <td colSpan={6} className="border border-black bg-gray-100 px-1 py-[2px] text-[7px] font-bold">
              <span className="fn"><b>26</b></span>Descrição
            </td>
            <td colSpan={2} className="border border-black bg-gray-100 px-1 py-[2px] text-center text-[7px] font-bold">
              <span className="fn"><b>27</b></span>Qtde. Solic.
            </td>
          </tr>

          {/* Procedure Rows */}
          {allItems.map((item, i) => (
            <tr key={i}>
              <td colSpan={1} className="border border-black px-1 py-[2px] text-center text-[8px]">
                {item.codigoTuss ? "22" : ""}
              </td>
              <td colSpan={3} className="border border-black px-1 py-[2px] text-center text-[8px]">
                {item.codigoTuss || ""}
              </td>
              <td colSpan={6} className="border border-black px-1 py-[2px] text-[8px]">
                {item.nome}
              </td>
              <td colSpan={2} className="border border-black px-1 py-[2px] text-center text-[8px]">
                1
              </td>
            </tr>
          ))}

          {/* Empty rows to fill minimum 10 procedure lines */}
          {Array.from({ length: Math.max(0, 10 - allItems.length) }).map((_, i) => (
            <tr key={`e-${i}`}>
              <td colSpan={1} className="border border-black px-1 py-[2px] text-[8px]">&nbsp;</td>
              <td colSpan={3} className="border border-black px-1 py-[2px] text-[8px]">&nbsp;</td>
              <td colSpan={6} className="border border-black px-1 py-[2px] text-[8px]">&nbsp;</td>
              <td colSpan={2} className="border border-black px-1 py-[2px] text-[8px]">&nbsp;</td>
            </tr>
          ))}

          {/* Free text */}
          {freeText.length > 0 && (
            <tr>
              <td colSpan={12} className={c}>
                <span className="fn">Obs:</span>
                <div className="fv">{freeText.join("; ")}</div>
              </td>
            </tr>
          )}

          {/* ═══ OBSERVAÇÃO / JUSTIFICATIVA ═══ */}
          <tr>
            <td colSpan={12} className={c}>
              <span className="fn"><b>58</b> - Observação / Justificativa</span>
              <div className="fv whitespace-pre-wrap">{e.observacoes || ""}</div>
            </td>
          </tr>

          {/* ═══ ASSINATURA DO PROFISSIONAL SOLICITANTE ═══ */}
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>20</b> - Data</span>
              <div className="fv">{e.data ? formatDateMedium(e.data) : ""}</div>
            </td>
            <td colSpan={9} className="border border-black px-1 py-1 text-center" style={{ height: 50 }}>
              <div className="flex h-full flex-col items-center justify-end">
                <div className="w-64 border-b border-black" />
                <span style={{ fontSize: 7, color: "#555", marginTop: 2 }}>
                  Assinatura do Profissional Solicitante
                </span>
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
