import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { PrintActions } from "./print-actions";
import {
  type InternacaoImpressao,
  formatDateMedium,
  CARATER_LABELS,
  TIPO_INTERNACAO_LABELS,
  REGIME_LABELS,
  INDICACAO_ACIDENTE_LABELS,
} from "../../types";
import { getClinicaAtual } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Imprimir Internação" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("internacoes")
    .select("pacientes(nome)")
    .eq("id", id)
    .single();
  const nome = (data as unknown as { pacientes: { nome: string } } | null)
    ?.pacientes?.nome;
  return { title: nome ? `Imprimir Internação - ${nome}` : "Imprimir Internação" };
}

export default async function ImprimirInternacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    registro_ans?: string;
    carteirinha?: string;
    validade_carteirinha?: string;
    codigo_operadora?: string;
    nome_contratado?: string;
    uf?: string;
    cbo?: string;
    hospital_codigo?: string;
    atendimento_rn?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();

  const { data: internacao } = await supabase
    .from("internacoes")
    .select(
      "id, data, hospital_nome, data_sugerida_internacao, carater_atendimento, tipo_internacao, regime_internacao, diarias_solicitadas, previsao_opme, previsao_quimioterapico, indicacao_clinica, cid_principal, cid_2, cid_3, cid_4, indicacao_acidente, procedimentos, observacoes, pacientes(id, nome, cpf)"
    )
    .eq("id", id)
    .single();

  if (!internacao) {
    notFound();
  }

  const i = internacao as unknown as InternacaoImpressao;

  const ctx = await getClinicaAtual();

  const [{ data: clinica }, { data: profConfigs }] = await Promise.all([
    ctx?.clinicaId
      ? supabase
          .from("clinicas")
          .select("nome")
          .eq("id", ctx.clinicaId)
          .single()
      : { data: null },
    supabase
      .from("configuracoes")
      .select("chave, valor")
      .eq("user_id", ctx?.userId ?? "")
      .in("chave", ["nome_profissional", "crm"]),
  ]);

  const cfg: Record<string, string> = {};
  if (clinica) {
    const c = clinica as { nome: string };
    cfg.nome_consultorio = c.nome;
  }
  (profConfigs ?? []).forEach((c: { chave: string; valor: string }) => {
    cfg[c.chave] = c.valor;
  });

  const registroANS = sp.registro_ans ?? "";
  const carteirinha = sp.carteirinha ?? "";
  const validadeCarteirinha = sp.validade_carteirinha ?? "";
  const codigoOperadora = sp.codigo_operadora ?? "";
  const nomeContratado = sp.nome_contratado ?? cfg.nome_consultorio ?? "";
  const uf = sp.uf ?? "";
  const cbo = sp.cbo ?? "";
  const hospitalCodigo = sp.hospital_codigo ?? "";
  const atendimentoRN = sp.atendimento_rn ?? "N";

  return (
    <div className="mx-auto w-full">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              html, body { margin: 0 !important; padding: 0 !important; }
              @page {
                size: A4 portrait;
                margin: 0;
              }
              .tiss-print-wrapper {
                padding: 6mm 8mm;
              }
            }
          `,
        }}
      />

      {/* Actions Bar */}
      <div className="no-print mb-6 space-y-4">
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: i.pacientes.nome, href: `/pacientes/${i.pacientes.id}` },
          { label: "Imprimir internação" },
        ]} />
        <PrintActions
          id={i.id}
          defaultRegistroANS={registroANS}
          defaultCarteirinha={carteirinha}
          defaultValidadeCarteirinha={validadeCarteirinha}
          defaultCodigoOperadora={codigoOperadora}
          defaultNomeContratado={nomeContratado}
          defaultUf={uf}
          defaultCbo={cbo}
          defaultHospitalCodigo={hospitalCodigo}
          defaultAtendimentoRN={atendimentoRN}
        />
      </div>

      <div className="tiss-print-wrapper">
        <TISSInternacao
          i={i}
          cfg={cfg}
          registroANS={registroANS}
          carteirinha={carteirinha}
          validadeCarteirinha={validadeCarteirinha}
          codigoOperadora={codigoOperadora}
          nomeContratado={nomeContratado}
          uf={uf}
          cbo={cbo}
          hospitalCodigo={hospitalCodigo}
          atendimentoRN={atendimentoRN}
        />
      </div>
    </div>
  );
}

function TISSInternacao({
  i,
  cfg,
  registroANS,
  carteirinha,
  validadeCarteirinha,
  codigoOperadora,
  nomeContratado,
  uf,
  cbo,
  hospitalCodigo,
  atendimentoRN,
}: {
  i: InternacaoImpressao;
  cfg: Record<string, string>;
  registroANS: string;
  carteirinha: string;
  validadeCarteirinha: string;
  codigoOperadora: string;
  nomeContratado: string;
  uf: string;
  cbo: string;
  hospitalCodigo: string;
  atendimentoRN: string;
}) {
  const procedimentoLines = i.procedimentos
    ? i.procedimentos.split("\n").filter((l) => l.trim())
    : [];

  const c = "border border-black px-1 py-[2px] align-top";
  const sh = "border border-black bg-gray-200 px-1 py-[2px] text-[8px] font-bold tracking-wide";

  return (
    <div className="bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        .tiss { border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 8px; line-height: 1.2; }
        .tiss td { vertical-align: top; }
        .tiss .fn { color: #555; font-size: 7px; display: block; }
        .tiss .fn b { font-weight: 700; }
        .tiss .fv { font-size: 9px; min-height: 12px; }
      `}} />

      <table className="tiss">
        <colgroup>
          {Array.from({ length: 12 }).map((_, idx) => (
            <col key={idx} style={{ width: `${100/12}%` }} />
          ))}
        </colgroup>
        <tbody>

          {/* TÍTULO */}
          <tr>
            <td colSpan={12} className="border border-black px-2 py-1 text-center">
              <b style={{ fontSize: 11, letterSpacing: 1 }}>GUIA DE SOLICITAÇÃO DE INTERNAÇÃO</b>
            </td>
          </tr>

          {/* ═══ 1-6: IDENTIFICAÇÃO DA GUIA ═══ */}
          <tr>
            <td colSpan={12} className={sh}>IDENTIFICAÇÃO DA GUIA</td>
          </tr>
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
              <span className="fn"><b>3</b> - Nº Guia Operadora</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>4</b> - Data Autorização</span>
              <div className="fv">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td colSpan={4} className={c}>
              <span className="fn"><b>5</b> - Senha</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={4} className={c}>
              <span className="fn"><b>6</b> - Data Validade Senha</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={4} className={c}>
              &nbsp;
            </td>
          </tr>

          {/* ═══ 7-11: DADOS DO BENEFICIÁRIO ═══ */}
          <tr>
            <td colSpan={12} className={sh}>DADOS DO BENEFICIÁRIO</td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>7</b> - Nº da Carteirinha</span>
              <div className="fv">{carteirinha}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>8</b> - Validade da Carteirinha</span>
              <div className="fv">{validadeCarteirinha}</div>
            </td>
            <td colSpan={1} className={c}>
              <span className="fn"><b>9</b> - Atend. RN</span>
              <div className="fv">{atendimentoRN}</div>
            </td>
            <td colSpan={4} className={c}>
              <span className="fn"><b>10</b> - Nome do Beneficiário</span>
              <div className="fv">{i.pacientes.nome}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>11</b> - Cartão Nac. Saúde</span>
              <div className="fv">&nbsp;</div>
            </td>
          </tr>

          {/* ═══ 12-18: DADOS DO CONTRATADO SOLICITANTE ═══ */}
          <tr>
            <td colSpan={12} className={sh}>DADOS DO CONTRATADO SOLICITANTE</td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>12</b> - Cód. Operadora Solicitante</span>
              <div className="fv">{codigoOperadora}</div>
            </td>
            <td colSpan={9} className={c}>
              <span className="fn"><b>13</b> - Nome do Contratado</span>
              <div className="fv">{nomeContratado}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={4} className={c}>
              <span className="fn"><b>14</b> - Nome do Profissional Solicitante</span>
              <div className="fv">{cfg.nome_profissional || ""}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>15</b> - Conselho</span>
              <div className="fv">CRM</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>16</b> - Nº no Conselho</span>
              <div className="fv">{cfg.crm || ""}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>17</b> - UF</span>
              <div className="fv">{uf}</div>
            </td>
            <td colSpan={2} className={c}>
              <span className="fn"><b>18</b> - Código CBO</span>
              <div className="fv">{cbo}</div>
            </td>
          </tr>

          {/* ═══ 19-27: DADOS DO HOSPITAL / DADOS DA INTERNAÇÃO ═══ */}
          <tr>
            <td colSpan={12} className={sh}>DADOS DO HOSPITAL / DADOS DA INTERNAÇÃO</td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>19</b> - Cód. Operadora Hospital</span>
              <div className="fv">{hospitalCodigo}</div>
            </td>
            <td colSpan={9} className={c}>
              <span className="fn"><b>20</b> - Nome do Hospital / Local Solicitado</span>
              <div className="fv">{i.hospital_nome || ""}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>21</b> - Data Sugerida para Internação</span>
              <div className="fv">{i.data_sugerida_internacao ? formatDateMedium(i.data_sugerida_internacao) : ""}</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>22</b> - Caráter do Atendimento</span>
              <div className="fv">{i.carater_atendimento ? CARATER_LABELS[i.carater_atendimento] : ""}</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>23</b> - Tipo de Internação</span>
              <div className="fv">{i.tipo_internacao ? TIPO_INTERNACAO_LABELS[i.tipo_internacao] : ""}</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>24</b> - Regime de Internação</span>
              <div className="fv">{i.regime_internacao ? REGIME_LABELS[i.regime_internacao] : ""}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>25</b> - Diárias Solicitadas</span>
              <div className="fv">{i.diarias_solicitadas ?? ""}</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>26</b> - Previsão de Uso de OPME</span>
              <div className="fv">{i.previsao_opme ? "S" : "N"}</div>
            </td>
            <td colSpan={6} className={c}>
              <span className="fn"><b>27</b> - Previsão de Uso de Quimioterápico</span>
              <div className="fv">{i.previsao_quimioterapico ? "S" : "N"}</div>
            </td>
          </tr>

          {/* ═══ 28-33: INDICAÇÃO CLÍNICA E CIDs ═══ */}
          <tr>
            <td colSpan={12} className={sh}>INDICAÇÃO CLÍNICA</td>
          </tr>
          <tr>
            <td colSpan={12} className={c}>
              <span className="fn"><b>28</b> - Indicação Clínica</span>
              <div className="fv whitespace-pre-wrap">{i.indicacao_clinica}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>29</b> - CID Principal</span>
              <div className="fv">{i.cid_principal || ""}</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>30</b> - CID (2)</span>
              <div className="fv">{i.cid_2 || ""}</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>31</b> - CID (3)</span>
              <div className="fv">{i.cid_3 || ""}</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>32</b> - CID (4)</span>
              <div className="fv">{i.cid_4 || ""}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={12} className={c}>
              <span className="fn"><b>33</b> - Indicação de Acidente (doença relacionada)</span>
              <div className="fv">{i.indicacao_acidente ? INDICACAO_ACIDENTE_LABELS[i.indicacao_acidente] : ""}</div>
            </td>
          </tr>

          {/* ═══ 34-38: PROCEDIMENTOS SOLICITADOS ═══ */}
          <tr>
            <td colSpan={12} className={sh}>PROCEDIMENTOS SOLICITADOS</td>
          </tr>
          {/* Header */}
          <tr>
            <td colSpan={1} className="border border-black bg-gray-100 px-1 py-[2px] text-center text-[7px] font-bold">
              <span className="fn"><b>34</b></span>Tabela
            </td>
            <td colSpan={3} className="border border-black bg-gray-100 px-1 py-[2px] text-center text-[7px] font-bold">
              <span className="fn"><b>35</b></span>Código do Procedimento
            </td>
            <td colSpan={6} className="border border-black bg-gray-100 px-1 py-[2px] text-[7px] font-bold">
              <span className="fn"><b>36</b></span>Descrição
            </td>
            <td colSpan={2} className="border border-black bg-gray-100 px-1 py-[2px] text-center text-[7px] font-bold">
              <span className="fn"><b>37</b></span>Qtde. Solic.
            </td>
          </tr>
          {/* Procedure Rows */}
          {procedimentoLines.map((line, idx) => (
            <tr key={idx}>
              <td colSpan={1} className="border border-black px-1 py-[2px] text-center text-[8px]">&nbsp;</td>
              <td colSpan={3} className="border border-black px-1 py-[2px] text-center text-[8px]">&nbsp;</td>
              <td colSpan={6} className="border border-black px-1 py-[2px] text-[8px]">{line}</td>
              <td colSpan={2} className="border border-black px-1 py-[2px] text-center text-[8px]">1</td>
            </tr>
          ))}
          {/* Empty rows to fill minimum 12 lines */}
          {Array.from({ length: Math.max(0, 12 - procedimentoLines.length) }).map((_, idx) => (
            <tr key={`e-${idx}`}>
              <td colSpan={1} className="border border-black px-1 py-[2px] text-[8px]">&nbsp;</td>
              <td colSpan={3} className="border border-black px-1 py-[2px] text-[8px]">&nbsp;</td>
              <td colSpan={6} className="border border-black px-1 py-[2px] text-[8px]">&nbsp;</td>
              <td colSpan={2} className="border border-black px-1 py-[2px] text-[8px]">&nbsp;</td>
            </tr>
          ))}

          {/* ═══ 39-44: DADOS DA AUTORIZAÇÃO ═══ */}
          <tr>
            <td colSpan={12} className={sh}>DADOS DA AUTORIZAÇÃO</td>
          </tr>
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>39</b> - Data Provável Admissão</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>40</b> - Qtde. Diárias Autorizadas</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>41</b> - Tipo de Acomodação</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>42</b> - Cód. Operadora Hospital Autorizado</span>
              <div className="fv">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td colSpan={6} className={c}>
              <span className="fn"><b>43</b> - Nome do Hospital Autorizado</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={3} className={c}>
              <span className="fn"><b>44</b> - CNES</span>
              <div className="fv">&nbsp;</div>
            </td>
            <td colSpan={3} className={c}>
              &nbsp;
            </td>
          </tr>

          {/* ═══ 45: OBSERVAÇÃO ═══ */}
          <tr>
            <td colSpan={12} className={c}>
              <span className="fn"><b>45</b> - Observação / Justificativa</span>
              <div className="fv whitespace-pre-wrap">{i.observacoes || ""}</div>
            </td>
          </tr>

          {/* ═══ 46: DATA DA SOLICITAÇÃO ═══ */}
          <tr>
            <td colSpan={3} className={c}>
              <span className="fn"><b>46</b> - Data da Solicitação</span>
              <div className="fv">{i.data ? formatDateMedium(i.data) : ""}</div>
            </td>
            <td colSpan={9} className={c}>
              &nbsp;
            </td>
          </tr>

          {/* ═══ 47-49: ASSINATURAS ═══ */}
          <tr>
            <td colSpan={12} className={sh}>ASSINATURAS</td>
          </tr>
          <tr>
            <td colSpan={4} className="border border-black px-1 py-1 text-center" style={{ height: 50 }}>
              <div className="flex h-full flex-col items-center justify-end">
                <div className="w-48 border-b border-black" />
                <span style={{ fontSize: 7, color: "#555", marginTop: 2 }}>
                  <b>47</b> - Assinatura do Profissional Solicitante
                </span>
              </div>
            </td>
            <td colSpan={4} className="border border-black px-1 py-1 text-center" style={{ height: 50 }}>
              <div className="flex h-full flex-col items-center justify-end">
                <div className="w-48 border-b border-black" />
                <span style={{ fontSize: 7, color: "#555", marginTop: 2 }}>
                  <b>48</b> - Assinatura do Beneficiário ou Responsável
                </span>
              </div>
            </td>
            <td colSpan={4} className="border border-black px-1 py-1 text-center" style={{ height: 50 }}>
              <div className="flex h-full flex-col items-center justify-end">
                <div className="w-48 border-b border-black" />
                <span style={{ fontSize: 7, color: "#555", marginTop: 2 }}>
                  <b>49</b> - Assinatura do Responsável pela Autorização
                </span>
              </div>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  );
}
