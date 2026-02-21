import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { PrintButton } from "./print-button";
import { type Paciente, ESTADO_CIVIL_LABELS, formatCPF, calcAge } from "../../types";
import { formatPhone } from "@/lib/format";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Vasectomia" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("pacientes")
    .select("nome")
    .eq("id", id)
    .single();
  return { title: data?.nome ? `Vasectomia - ${data.nome}` : "Vasectomia" };
}

function BlankField({ label, width = "flex-1" }: { label: string; width?: string }) {
  return (
    <div className={`${width} flex items-end gap-1`}>
      <span className="shrink-0 text-xs font-semibold">{label}:</span>
      <span className="flex-1 border-b border-gray-400" />
    </div>
  );
}

function BlankLine() {
  return <div className="w-full border-b border-gray-400 py-2" />;
}

export default async function VasectomiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single<Paciente>();

  if (!paciente) notFound();

  const [ctx, medicoId] = await Promise.all([
    getClinicaAtual(),
    getMedicoId().catch(() => null),
  ]);

  const [{ data: clinica }, { data: profConfigs }] = await Promise.all([
    ctx?.clinicaId
      ? supabase
          .from("clinicas")
          .select("nome, cidade")
          .eq("id", ctx.clinicaId)
          .single()
      : { data: null },
    medicoId
      ? supabase
          .from("configuracoes")
          .select("chave, valor")
          .eq("user_id", medicoId)
          .in("chave", ["nome_profissional", "crm"])
      : { data: [] },
  ]);

  const cfg: Record<string, string> = {};
  if (clinica) {
    const c = clinica as { nome: string; cidade: string | null };
    cfg.nome_consultorio = c.nome;
    cfg.cidade = c.cidade ?? "";
  }
  (profConfigs ?? []).forEach((c: { chave: string; valor: string }) => {
    cfg[c.chave] = c.valor;
  });

  const idade = paciente.data_nascimento ? calcAge(paciente.data_nascimento) : null;
  const estadoCivil = paciente.estado_civil
    ? (ESTADO_CIVIL_LABELS[paciente.estado_civil] ?? paciente.estado_civil)
    : "";
  const cpfFormatado = paciente.cpf ? formatCPF(paciente.cpf) : "";
  const telefoneFormatado = paciente.telefone ? formatPhone(paciente.telefone) : "";
  const enderecoCompleto = [
    paciente.endereco,
    paciente.numero ? `n\u00BA ${paciente.numero}` : null,
    paciente.bairro,
    paciente.cidade,
    paciente.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const hoje = new Date();
  const dataHoje = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;

  return (
    <div className="mx-auto max-w-3xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              html, body { margin: 0 !important; padding: 0 !important; }
              @page { size: A4 portrait; margin: 0; }
              .print-page { padding: 12mm 15mm; }
              .page-break { page-break-after: always; }
            }
          `,
        }}
      />

      {/* UI Layer */}
      <div className="no-print mb-6 flex items-center justify-between">
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: paciente.nome, href: `/pacientes/${paciente.id}` },
          { label: "Vasectomia" },
        ]} />
        <PrintButton />
      </div>

      {/* ============ PÁGINA 1 ============ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="print-page p-6 sm:p-8">
          {/* Cabeçalho do formulário */}
          <div className="mb-4 border border-gray-300">
            <div className="flex items-center justify-between border-b border-gray-300 px-3 py-1.5">
              <span className="text-xs font-bold">FRM.TURO.047</span>
              <span className="text-xs">Data: 07/2022</span>
              <span className="text-xs">Revisão: 00</span>
              <span className="text-xs">Folha: 1/2</span>
            </div>
            <div className="px-3 py-2 text-center">
              <h1 className="text-sm font-bold uppercase leading-tight">
                Consentimento Informado Livre e Esclarecido &mdash; Vasectomia
              </h1>
              <p className="text-xs font-semibold">Anexo II</p>
            </div>
          </div>

          {/* Dados do paciente */}
          <div className="space-y-2 text-xs leading-relaxed">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-end gap-1">
                <span className="font-semibold">Paciente:</span>
                <span className="border-b border-gray-400 px-1">{paciente.nome}</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="font-semibold">Idade:</span>
                <span className="border-b border-gray-400 px-1">{idade ?? ""}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <BlankField label="Nacionalidade" />
              <div className="flex items-end gap-1">
                <span className="font-semibold">Estado Civil:</span>
                <span className="border-b border-gray-400 px-1">{estadoCivil}</span>
              </div>
              <BlankField label="Profiss\u00E3o" />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-end gap-1">
                <span className="font-semibold">CPF:</span>
                <span className="border-b border-gray-400 px-1">{cpfFormatado}</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="font-semibold">Identidade/RG:</span>
                <span className="border-b border-gray-400 px-1">{paciente.rg ?? ""}</span>
              </div>
            </div>

            <div className="flex items-end gap-1">
              <span className="font-semibold">Endere\u00E7o:</span>
              <span className="flex-1 border-b border-gray-400 px-1">{enderecoCompleto}</span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-end gap-1">
                <span className="font-semibold">Telefone:</span>
                <span className="border-b border-gray-400 px-1">{telefoneFormatado}</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="font-semibold">Endere\u00E7o Eletr\u00F4nico:</span>
                <span className="border-b border-gray-400 px-1">{paciente.email ?? ""}</span>
              </div>
            </div>

            <div className="flex items-end gap-1">
              <span className="font-semibold">N\u00FAmero de filhos vivos:</span>
              <span className="w-16 border-b border-gray-400" />
            </div>

            {/* Filhos */}
            <div className="mt-1 space-y-1">
              <p className="font-semibold">Nomes e idades dos filhos:</p>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-end gap-1 pl-2">
                  <span className="shrink-0">{n}.</span>
                  <span className="flex-1 border-b border-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Texto do consentimento */}
          <div className="mt-4 space-y-2 text-xs leading-relaxed">
            <p className="text-justify">
              Declaro, para os devidos fins, que fui devidamente esclarecido(a) pelo
              Dr(a). <span className="font-semibold">{cfg.nome_profissional ?? "_______________"}</span> sobre
              os seguintes pontos referentes \u00E0 cirurgia de Vasectomia a que serei submetido:
            </p>

            <p className="text-justify">
              <span className="font-semibold">(A)</span> A vasectomia \u00E9 um m\u00E9todo
              contraceptivo irrevers\u00EDvel. Ap\u00F3s a cirurgia, em geral, n\u00E3o ser\u00E1
              mais poss\u00EDvel gerar filhos naturalmente. A revers\u00E3o (vasovasostomia)
              \u00E9 uma cirurgia complexa, de alto custo e sem garantia de sucesso.
            </p>

            <p className="text-justify">
              <span className="font-semibold">(B)</span> Existem outros m\u00E9todos
              contraceptivos revers\u00EDveis dispon\u00EDveis (p\u00EDlula, DIU,
              preservativo, etc.) que me foram apresentados como alternativas.
            </p>

            <p className="text-justify">
              <span className="font-semibold">(C)</span> A cirurgia consiste na
              sec\u00E7\u00E3o e/ou oclusão dos canais deferentes, impedindo a
              passagem dos espermatozoides. O procedimento \u00E9 realizado com
              anestesia local, com ou sem sedação.
            </p>

            <p className="text-justify">
              <span className="font-semibold">(D)</span> Como qualquer procedimento
              cir\u00FArgico, a vasectomia apresenta riscos, incluindo: sangramento,
              infec\u00E7\u00E3o, dor cr\u00F4nica, hematoma, granuloma
              esperm\u00E1tico e, raramente, recanaliza\u00E7\u00E3o espont\u00E2nea.
            </p>

            <p className="text-justify">
              <span className="font-semibold">(E)</span> A esterilidade n\u00E3o \u00E9
              imediata. \u00C9 necess\u00E1rio realizar espermograma de controle
              ap\u00F3s 60 dias ou 20 ejacula\u00E7\u00F5es (o que ocorrer primeiro)
              para confirmar a aus\u00EAncia de espermatozoides. At\u00E9 a
              confirma\u00E7\u00E3o, deve-se manter outro m\u00E9todo contraceptivo.
            </p>

            <p className="text-justify">
              <span className="font-semibold">(F)</span> A vasectomia n\u00E3o protege
              contra infec\u00E7\u00F5es sexualmente transmiss\u00EDveis (ISTs/AIDS).
              O uso de preservativo continua sendo recomendado para preven\u00E7\u00E3o.
            </p>

            <p className="text-justify">
              <span className="font-semibold">(G)</span> Declaro que tive a oportunidade
              de fazer perguntas e que todas as minhas d\u00FAvidas foram esclarecidas
              de forma clara e satisfat\u00F3ria.
            </p>

            <p className="text-justify">
              <span className="font-semibold">(H)</span> Declaro que li (ou me foi lido)
              o presente termo, que compreendi seu conte\u00FAdo e que consinto
              livremente com a realiza\u00E7\u00E3o da vasectomia.
            </p>
          </div>

          {/* Dados do cônjuge */}
          <div className="mt-4 space-y-2 text-xs">
            <p className="font-semibold">Dados do c\u00F4njuge / companheiro(a):</p>
            <div className="space-y-1 pl-2">
              <BlankField label="Nome" />
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <BlankField label="Identidade/RG" />
                <BlankField label="CPF" />
              </div>
              <BlankField label="Telefone" />
            </div>
          </div>
        </div>
      </div>

      {/* Page break */}
      <div className="page-break" />

      {/* ============ PÁGINA 2 ============ */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm print:mt-0 print:rounded-none print:border-0 print:shadow-none">
        <div className="print-page p-6 sm:p-8">
          {/* Cabeçalho página 2 */}
          <div className="mb-4 border border-gray-300">
            <div className="flex items-center justify-between border-b border-gray-300 px-3 py-1.5">
              <span className="text-xs font-bold">FRM.TURO.047</span>
              <span className="text-xs">Data: 07/2022</span>
              <span className="text-xs">Revisão: 00</span>
              <span className="text-xs">Folha: 2/2</span>
            </div>
            <div className="px-3 py-2 text-center">
              <h2 className="text-sm font-bold uppercase leading-tight">
                Consentimento Informado Livre e Esclarecido &mdash; Vasectomia
              </h2>
              <p className="text-xs font-semibold">Anexo II (continua\u00E7\u00E3o)</p>
            </div>
          </div>

          {/* Autorização */}
          <div className="space-y-3 text-xs leading-relaxed">
            <p className="text-justify">
              Diante do exposto, <span className="font-semibold">AUTORIZO</span> o(a)
              Dr(a). <span className="font-semibold">{cfg.nome_profissional ?? "_______________"}</span> e
              sua equipe a realizar a cirurgia de <span className="font-semibold">VASECTOMIA</span>,
              estando ciente de todos os riscos, benef\u00EDcios e alternativas que me
              foram explicados.
            </p>
          </div>

          {/* Dados cirurgia */}
          <div className="mt-4 space-y-1 text-xs">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <BlankField label="Data da Cirurgia" />
              <BlankField label="Data da Alta" />
              <BlankField label="Reg. Hospitalar" />
            </div>
          </div>

          {/* Local e data */}
          <div className="mt-6 text-xs">
            <p>
              {cfg.cidade || "_______________"}, {dataHoje}
            </p>
          </div>

          {/* Assinaturas */}
          <div className="mt-10 space-y-8 text-xs">
            {/* Paciente */}
            <div className="flex flex-col items-center">
              <div className="w-80 border-b border-gray-900" />
              <p className="mt-1 font-semibold">Assinatura do Paciente</p>
              <p className="text-gray-600">{paciente.nome}</p>
            </div>

            {/* Cônjuge */}
            <div className="flex flex-col items-center">
              <div className="w-80 border-b border-gray-900" />
              <p className="mt-1 font-semibold">Assinatura do C\u00F4njuge / Companheiro(a)</p>
            </div>

            {/* Médico */}
            <div className="flex flex-col items-center">
              <div className="w-80 border-b border-gray-900" />
              <p className="mt-1 font-semibold">M\u00E9dico Respons\u00E1vel</p>
              {cfg.nome_profissional && (
                <p className="text-gray-600">{cfg.nome_profissional}</p>
              )}
              {cfg.crm && (
                <p className="text-gray-600">CRM {cfg.crm}</p>
              )}
            </div>

            {/* Testemunhas */}
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <div className="w-full border-b border-gray-900" />
                <p className="mt-1 font-semibold">Testemunha 1</p>
                <BlankLine />
                <p className="text-[10px] text-gray-500">Nome / RG</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-b border-gray-900" />
                <p className="mt-1 font-semibold">Testemunha 2</p>
                <BlankLine />
                <p className="text-[10px] text-gray-500">Nome / RG</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
