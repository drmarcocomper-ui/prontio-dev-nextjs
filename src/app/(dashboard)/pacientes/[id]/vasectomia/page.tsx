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

function Field({ label, value, className = "" }: { label: string; value?: string; className?: string }) {
  return (
    <span className={`inline ${className}`}>
      {label}: {value
        ? <span className="border-b border-gray-900 px-1">{value}</span>
        : <span className="inline-block min-w-[120px] border-b border-gray-900" />
      }
    </span>
  );
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

  const idade = paciente.data_nascimento ? String(calcAge(paciente.data_nascimento)) : "";
  const estadoCivil = paciente.estado_civil
    ? (ESTADO_CIVIL_LABELS[paciente.estado_civil] ?? paciente.estado_civil)
    : "";
  const cpfFormatado = paciente.cpf ? formatCPF(paciente.cpf) : "";
  const telefoneFormatado = paciente.telefone ? formatPhone(paciente.telefone) : "";
  const enderecoCompleto = [
    paciente.endereco,
    paciente.numero ? `nº ${paciente.numero}` : null,
    paciente.bairro,
    paciente.cidade,
    paciente.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const hoje = new Date();
  const dataHoje = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;

  const nomeMedico = cfg.nome_profissional ?? "_______________";

  return (
    <div className="mx-auto max-w-3xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              html, body { margin: 0 !important; padding: 0 !important; }
              @page { size: A4 portrait; margin: 8mm 12mm; }
              /* Reset layout containers que bloqueiam paginação */
              * { overflow: visible !important; }
              main { padding: 0 !important; }
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8 print:rounded-none print:border-0 print:shadow-none print:p-0">
        {/* ============ PÁGINA 1 ============ */}
        <div>
          {/* Cabeçalho do formulário */}
          <div className="mb-3 text-center">
            <p className="text-xs font-bold">FRM.TURO.047</p>
            <h1 className="text-sm font-bold uppercase">
              Consentimento Informado Livre e Esclarecido
            </h1>
            <p className="text-xs">DATA: 29/05/2015</p>
            <p className="text-xs">REV 001</p>
            <p className="text-xs">FL: 1/2</p>
          </div>

          <h2 className="mb-2 text-sm font-bold">VASECTOMIA &ndash; ANEXO II</h2>

          {/* Dados do paciente */}
          <div className="space-y-1 text-xs leading-normal">
            <div>
              <span className="font-semibold">Paciente:</span>{" "}
              <span className="border-b border-gray-900 px-1">{paciente.nome}</span>
            </div>

            <div className="flex flex-wrap gap-x-4">
              <Field label="Idade" value={idade} />
              <Field label="Estado Civil" value={estadoCivil} />
              <Field label="Nacionalidade" />
            </div>

            <div className="flex flex-wrap gap-x-4">
              <Field label="Identidade" value={paciente.rg ?? ""} />
              <Field label="CPF nº" value={cpfFormatado} />
              <Field label="Profissão" />
            </div>

            <div>
              <span className="font-semibold">Endereço:</span>{" "}
              <span className="border-b border-gray-900 px-1">{enderecoCompleto || ""}</span>
            </div>

            <div className="flex flex-wrap gap-x-4">
              <Field label="Telefone" value={telefoneFormatado} />
              <span>
                Endereço Eletrônico:{" "}
                <span className="border-b border-gray-900 px-1">{paciente.email ?? ""}</span>
              </span>
            </div>

            <div>
              <Field label="Número de Filhos vivos" />
            </div>

            <div>
              <span className="font-semibold">Nome e Idade dos Filhos:</span>
              <span className="inline-block w-full border-b border-gray-900" />
            </div>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-end gap-1">
                <span>{n})</span>
                <span className="flex-1 border-b border-gray-900" />
              </div>
            ))}

            <div className="flex flex-wrap gap-x-4">
              <span className="w-full">
                Nome do cônjuge/convivente:{" "}
                <span className="inline-block min-w-[200px] border-b border-gray-900" />
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4">
              <Field label="Identidade" />
              <Field label="CPF nº" />
              <Field label="nº Telefone" />
            </div>
          </div>

          {/* Texto do consentimento */}
          <div className="mt-3 space-y-1.5 text-xs leading-snug">
            <p className="text-justify">
              {'"'}Eu, abaixo assinado, autorizo o(a) Dr(a) <span className="font-semibold">{nomeMedico}</span> a
              realizar a cirurgia de vasectomia.
            </p>

            <p className="text-justify">
              Por este termo, em plena capacidade de discernimento, manifesto a vontade de
              submeter-me, voluntariamente, à cirurgia de vasectomia, e ainda, declaro:
            </p>

            <p className="text-justify">
              <span className="font-semibold">(A)</span> Estar ciente das regras do planejamento
              familiar, observado o prazo mínimo de 60 (sessenta) dias entre a manifestação da
              vontade e o ato cirúrgico, de acordo com a Lei que normatiza a cirurgia de vasectomia
              no Brasil, sabendo que não será aceita a minha manifestação de vontade se estiver
              sobre influência de álcool, drogas, estado emocional alterado, ou por incapacidade
              mental temporária ou permanente;
            </p>

            <p className="text-justify">
              <span className="font-semibold">(B)</span> Que foi me explicado e para minha esposa,
              que existem outros métodos alternativos de contracepção a nossa disposição,
              exemplificando: uso de camisinha, DIU, pílulas anticoncepcionais, e todos os demais
              métodos naturais e de barreira. Fui também informado de que a intervenção de
              vasectomia consiste basicamente na interrupção da continuidade do(s) duto(s)
              deferente(s). Fui informado que existe possibilidade (1 em cada 2.000 vasectomias)
              de ocorrer recanalização espontânea, ou seja de ocorrer a passagem dos
              espermatozoides de um ducto para o outro, permitindo assim a fertilidade com
              possível gravidez indesejada. Esse procedimento é usualmente realizado em nível
              ambulatorial e sob anestesia local;
            </p>

            <p className="text-justify">
              <span className="font-semibold">(C)</span> Foi salientado pelo médico que após a
              cirurgia de vasectomia poderei voltar a ter relações sexuais após uma semana e
              continuar a ter os mesmos cuidados para evitar filhos até que se complete 25 (vinte
              e cinco) ejaculações e, que se tenha feito um espermograma mostrando ausência de
              espermatozoide no ejaculado, ou seja, depois da operação eu devo fazer um
              espermograma, mostrar ao médico e só depois de ele constatar que não tem mais
              espermatozoide é que poderei ter relações sem qualquer forma de método para evitar
              filhos;
            </p>

            <p className="text-justify">
              <span className="font-semibold">(D)</span> Também foi explicado que a operação de
              vasectomia é definitiva, vou ficar infértil para o resto da minha vida e que uma
              operação que se faz para reverter a fertilidade não é segura nem coberta pelo plano
              de saúde;
            </p>

            <p className="text-justify">
              <span className="font-semibold">(E)</span> Que recebi do médico as orientações sobre
              os cuidados que devo seguir para alcançar o melhor resultado, estando ciente de que
              nessa cirurgia poderão ocorrer complicações Intra-operatórias: Hemorragias e
              queimaduras por bisturi elétrico; E pós-operatórias: Seromas, hematomas (sangramento
              interno), manchas escuras no escroto e/ou pênis (equimoses), dor ou infecção (febre)
              entre outras; quando{'"'}
            </p>
          </div>
        </div>

        <hr className="my-8 border-gray-300 print:hidden" />

        {/* ============ PÁGINA 2 ============ */}
        <div className="break-before-page">
          {/* Cabeçalho página 2 */}
          <div className="mb-6 text-center">
            <p className="text-xs font-bold">FRM.TURO.047</p>
            <h2 className="mt-1 text-sm font-bold uppercase">
              Consentimento Informado Livre e Esclarecido
            </h2>
            <div className="mt-1 flex items-center justify-center gap-6 text-xs">
              <span>DATA: 29/05/2015</span>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs">
              <span>REV 001</span>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs">
              <span>FL: 2/2</span>
            </div>
          </div>

          {/* Continuação do texto */}
          <div className="space-y-3 text-xs leading-relaxed">
            <p className="text-justify">
              {'"'}então deverei informá-lo, imediatamente sobre essas possíveis
              alterações/problemas que porventura possam surgir, assim como, retornar ao
              consultório/hospital nos dias determinados por ele;
            </p>

            <p className="text-justify">
              <span className="font-semibold">(F)</span> Que em toda intervenção existe um risco
              excepcional de mortalidade derivado do ato cirúrgico e da situação vital de cada
              paciente; que se no momento do ato cirúrgico surgir algum imprevisto, a equipe médica
              poderá variar a técnica cirúrgica programada;
            </p>

            <p className="text-justify">
              <span className="font-semibold">(G)</span> Que na vigência da sociedade conjugal a
              realização dessa intervenção cirúrgica dependerá do consentimento expresso de ambos
              os cônjuges;
            </p>

            <p className="text-justify">
              <span className="font-semibold">(H)</span> Que foi esclarecido ser do meu livre
              arbítrio a decisão a ser tomada, bem como que poderei desistir de realizar o
              procedimento cirúrgico a qualquer momento, sem necessidade de apresentar explicações.
            </p>

            <p className="text-justify">
              Pelo presente, DECLARO que entendi todas as informações, orientações e explicações
              prestadas e repassadas pelo médico, em linguagem simples e clara, e que minhas
              dúvidas foram plenamente esclarecidas. Assim sendo, declaro-me satisfeito com as
              informações, orientações e explicações recebidas, compreendendo o alcance e os
              riscos da cirurgia de vasectomia.
            </p>

            <p className="text-justify">
              Por tal razão, manifesto expressamente minha concordância e consentimento para
              realização do procedimento acima descrito.{'"'}
            </p>
          </div>

          {/* Local e data */}
          <div className="mt-8 flex flex-wrap gap-x-16 text-xs">
            <div>
              <span className="border-b border-gray-900 px-1">{cfg.cidade || "_______________"}/ES</span>
              <br />
              <span className="text-gray-500">Cidade</span>
            </div>
            <div>
              <span className="border-b border-gray-900 px-1">{dataHoje}</span>
              <br />
              <span className="text-gray-500">Data</span>
            </div>
          </div>

          {/* Assinaturas */}
          <div className="mt-10 space-y-8 text-xs">
            {/* Paciente e Cônjuge */}
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-full border-b border-gray-900" />
                <p className="mt-1 font-semibold">Assinatura do paciente</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-full border-b border-gray-900" />
                <p className="mt-1 font-semibold">Assinatura do cônjuge*</p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  * afirmar de próprio punho, se for o caso {'"'}não há{'"'}.
                </p>
              </div>
            </div>

            {/* Médico */}
            <div className="flex flex-col items-start">
              <div className="w-64 border-b border-gray-900" />
              <p className="mt-1 font-semibold">Assinatura/CRM do Médico</p>
              {cfg.nome_profissional && (
                <p className="text-gray-600">{cfg.nome_profissional}</p>
              )}
              {cfg.crm && (
                <p className="text-gray-600">CRM {cfg.crm}</p>
              )}
            </div>

            {/* Testemunhas */}
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-full border-b border-gray-900" />
                <p className="mt-1 font-semibold">Testemunha (1)</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-full border-b border-gray-900" />
                <p className="mt-1 font-semibold">Testemunha (2)</p>
              </div>
            </div>
          </div>

          {/* Cópias anexas */}
          <div className="mt-8 text-xs">
            <p className="font-semibold">Cópias anexas:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Certidão de Casamento/Declaração de União Estável (quando aplicável);</li>
              <li>Carteira de Identidade;</li>
              <li>Certidões de Nascimento dos filhos.</li>
            </ul>
          </div>

          {/* Dados finais */}
          <div className="mt-6 space-y-2 text-xs">
            <div className="flex flex-wrap gap-x-8">
              <span>Data da Consulta: <span className="border-b border-gray-900 px-1">{dataHoje}</span></span>
              <span>Data da Cirurgia: ___/___/___</span>
            </div>
            <div className="flex flex-wrap gap-x-8">
              <span>Data da Alta: ___/___/___</span>
              <Field label="Reg. Hospitalar" />
            </div>
          </div>

          <p className="mt-4 text-[10px] text-gray-500">
            Reconhecer firma da assinatura do paciente e seu cônjuge nas três vias.
          </p>
        </div>
      </div>
    </div>
  );
}
