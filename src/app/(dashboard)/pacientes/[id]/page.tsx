import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/delete-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { excluirPaciente } from "../actions";
import { Tabs } from "./tabs";
import {
  type Paciente,
  SEXO_LABELS, ESTADO_CIVIL_LABELS, TIPO_LABELS, RECEITA_TIPO_LABELS,
  formatCPF, formatPhone, formatCEP, formatDate, getInitials, calcAge,
} from "../types";
import { formatDateMedium } from "@/lib/format";
import { getClinicaAtual, getMedicoId, isProfissional } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Paciente" };
  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { title: "Paciente" };
  }
  const { data } = await supabase
    .from("pacientes")
    .select("nome")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();
  return { title: data?.nome ?? "Paciente" };
}

function InfoItem({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">
        {value ? (
          href ? (
            <a href={href} className="text-primary-600 transition-colors hover:text-primary-700 hover:underline">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          "—"
        )}
      </dd>
    </div>
  );
}

export default async function PacienteDetalhesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const currentTab = tab || "identificacao";
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  const isMedico = ctx ? isProfissional(ctx.papel) : false;
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    notFound();
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single<Paciente>();

  if (!paciente) {
    notFound();
  }

  const { data: prontuarios, count: totalProntuarios } = await supabase
    .from("prontuarios")
    .select("id, data, tipo, cid, queixa_principal", { count: "exact" })
    .eq("paciente_id", id)
    .order("data", { ascending: false })
    .limit(5);

  const { data: receitas } = await supabase
    .from("receitas")
    .select("id, data, tipo, medicamentos")
    .eq("paciente_id", id)
    .order("data", { ascending: false });

  // Timeline data (only fetch when needed)
  const { data: agendamentos } = currentTab === "historico"
    ? await supabase
        .from("agendamentos")
        .select("id, data, hora_inicio, hora_fim, tipo, status")
        .eq("paciente_id", id)
        .order("data", { ascending: false })
        .limit(50)
    : { data: null };

  const { data: transacoes } = currentTab === "historico"
    ? await supabase
        .from("transacoes")
        .select("id, data, descricao, tipo, valor, status")
        .eq("paciente_id", id)
        .order("data", { ascending: false })
        .limit(50)
    : { data: null };

  const enderecoCompleto = [
    paciente.endereco,
    paciente.numero ? `nº ${paciente.numero}` : null,
    paciente.complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const cidadeEstado = [paciente.cidade, paciente.estado]
    .filter(Boolean)
    .join(" - ");

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <Breadcrumb items={[
        { label: "Pacientes", href: "/pacientes" },
        { label: paciente.nome },
      ]} />

      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
            {getInitials(paciente.nome)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{paciente.nome}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
              {paciente.data_nascimento && (
                <span>
                  {formatDate(paciente.data_nascimento)} ({calcAge(paciente.data_nascimento)} anos)
                </span>
              )}
              {paciente.sexo && <span>{SEXO_LABELS[paciente.sexo] ?? paciente.sexo}</span>}
              {paciente.convenio && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {paciente.convenio}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/pacientes/${paciente.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton onDelete={excluirPaciente.bind(null, paciente.id)} title="Excluir paciente" description="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir paciente. Tente novamente." />
        </div>
      </div>

      <Tabs pacienteId={id} />

      {currentTab === "identificacao" && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Dados pessoais */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Dados pessoais
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem label="CPF" value={paciente.cpf ? formatCPF(paciente.cpf) : null} />
            <InfoItem label="RG" value={paciente.rg} />
            <InfoItem
              label="Data de nascimento"
              value={
                paciente.data_nascimento
                  ? `${formatDate(paciente.data_nascimento)} (${calcAge(paciente.data_nascimento)} anos)`
                  : null
              }
            />
            <InfoItem label="Sexo" value={paciente.sexo ? (SEXO_LABELS[paciente.sexo] ?? paciente.sexo) : null} />
            <InfoItem
              label="Estado civil"
              value={paciente.estado_civil ? (ESTADO_CIVIL_LABELS[paciente.estado_civil] ?? paciente.estado_civil) : null}
            />
          </dl>
        </div>

        {/* Contato */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Contato
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            <InfoItem label="Telefone" value={paciente.telefone ? formatPhone(paciente.telefone) : null} href={paciente.telefone ? `tel:${paciente.telefone.replace(/\D/g, "")}` : undefined} />
            <InfoItem label="E-mail" value={paciente.email} href={paciente.email ? `mailto:${paciente.email}` : undefined} />
          </dl>
        </div>

        {/* Endereço */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            Endereço
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <InfoItem label="Logradouro" value={enderecoCompleto || null} />
            </div>
            <InfoItem label="Bairro" value={paciente.bairro} />
            <InfoItem label="Cidade / UF" value={cidadeEstado || null} />
            <InfoItem label="CEP" value={paciente.cep ? formatCEP(paciente.cep) : null} />
          </dl>
        </div>

        {/* Informações adicionais */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            Informações adicionais
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            <InfoItem label="Convênio" value={paciente.convenio} />
            <InfoItem label="Observações" value={paciente.observacoes} />
            <InfoItem
              label="Cadastrado em"
              value={formatDateMedium(paciente.created_at.slice(0, 10))}
            />
          </dl>
        </div>
      </div>
      )}

      {currentTab === "prontuario" && isMedico && (
      <>
      {/* Evoluções clínicas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Evoluções clínicas
          </h2>
          <Link
            href={`/prontuarios/novo?paciente_id=${paciente.id}&paciente_nome=${encodeURIComponent(paciente.nome)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova evolução
          </Link>
        </div>

        {prontuarios && prontuarios.length > 0 ? (
          <div className="space-y-3">
            {prontuarios.map((pront) => (
              <Link
                key={pront.id}
                href={`/prontuarios/${pront.id}?from=paciente`}
                className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-200 hover:bg-gray-50 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(pront.data)}
                      </span>
                      {pront.tipo && (
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                          {TIPO_LABELS[pront.tipo] ?? pront.tipo}
                        </span>
                      )}
                      {pront.cid && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          CID: {pront.cid}
                        </span>
                      )}
                    </div>
                    {pront.queixa_principal && (
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {pront.queixa_principal}
                      </p>
                    )}
                  </div>
                  <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
            {(totalProntuarios ?? 0) > 5 && (
              <Link
                href={`/prontuarios?paciente_id=${paciente.id}`}
                className="block py-2 text-center text-sm font-medium text-violet-600 transition-colors hover:text-violet-700"
              >
                Ver todas as evoluções ({totalProntuarios}) →
              </Link>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">
            Nenhuma evolução registrada.
          </p>
        )}
      </div>

      {/* Receitas médicas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg aria-hidden="true" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            Receitas médicas
          </h2>
          <Link
            href={`/receitas/novo?paciente_id=${paciente.id}&paciente_nome=${encodeURIComponent(paciente.nome)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova receita
          </Link>
        </div>

        {receitas && receitas.length > 0 ? (
          <div className="space-y-3">
            {receitas.map((rec) => (
              <Link
                key={rec.id}
                href={`/receitas/${rec.id}`}
                className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-200 hover:bg-gray-50 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(rec.data)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {RECEITA_TIPO_LABELS[rec.tipo] ?? rec.tipo}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {rec.medicamentos}
                    </p>
                  </div>
                  <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">
            Nenhuma receita emitida.
          </p>
        )}
      </div>
      </>
      )}

      {currentTab === "historico" && (() => {
        // Merge all events into timeline
        type TimelineEvent = {
          id: string;
          date: string;
          type: "prontuario" | "agendamento" | "receita" | "transacao";
          title: string;
          subtitle?: string;
          href: string;
          color: string;
        };

        const events: TimelineEvent[] = [];

        for (const p of prontuarios ?? []) {
          events.push({
            id: `p-${p.id}`,
            date: p.data,
            type: "prontuario",
            title: p.queixa_principal || "Evolução clínica",
            subtitle: [p.tipo ? (TIPO_LABELS[p.tipo] ?? p.tipo) : null, p.cid ? `CID: ${p.cid}` : null].filter(Boolean).join(" · "),
            href: `/prontuarios/${p.id}`,
            color: "bg-violet-500",
          });
        }

        for (const a of agendamentos ?? []) {
          const ag = a as { id: string; data: string; hora_inicio: string; hora_fim: string; tipo: string | null; status: string };
          events.push({
            id: `a-${ag.id}`,
            date: ag.data,
            type: "agendamento",
            title: `${ag.hora_inicio.slice(0, 5)} – ${ag.hora_fim.slice(0, 5)}`,
            subtitle: [ag.tipo ? (TIPO_LABELS[ag.tipo] ?? ag.tipo) : null, ag.status].filter(Boolean).join(" · "),
            href: `/agenda/${ag.id}`,
            color: "bg-blue-500",
          });
        }

        for (const r of receitas ?? []) {
          events.push({
            id: `r-${r.id}`,
            date: r.data,
            type: "receita",
            title: "Receita médica",
            subtitle: r.medicamentos?.slice(0, 80),
            href: `/receitas/${r.id}`,
            color: "bg-emerald-500",
          });
        }

        for (const t of transacoes ?? []) {
          const tr = t as { id: string; data: string; descricao: string; tipo: string; valor: number; status: string };
          events.push({
            id: `t-${tr.id}`,
            date: tr.data,
            type: "transacao",
            title: tr.descricao,
            subtitle: `R$ ${tr.valor.toFixed(2).replace(".", ",")}`,
            href: `/financeiro/${tr.id}`,
            color: tr.tipo === "receita" ? "bg-emerald-500" : "bg-red-500",
          });
        }

        events.sort((a, b) => b.date.localeCompare(a.date));

        const TYPE_LABELS: Record<string, string> = {
          prontuario: "Prontuário",
          agendamento: "Agendamento",
          receita: "Receita",
          transacao: "Financeiro",
        };

        return (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Linha do tempo</h2>
            {events.length > 0 ? (
              <div className="relative space-y-0">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="group relative flex gap-4 py-3 pl-6 transition-colors hover:bg-gray-50 rounded-lg"
                  >
                    <div className={`absolute left-0 top-[18px] h-3.5 w-3.5 rounded-full border-2 border-white ${event.color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">
                          {formatDate(event.date)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          {TYPE_LABELS[event.type]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-gray-900 group-hover:text-primary-600">
                        {event.title}
                      </p>
                      {event.subtitle && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {event.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-gray-400">
                Nenhum registro encontrado.
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
