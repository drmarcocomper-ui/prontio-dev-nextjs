import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "./delete-button";

interface Paciente {
  id: string;
  nome: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  estado_civil: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  convenio: string | null;
  observacoes: string | null;
  created_at: string;
}

function formatCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone;
}

function formatCEP(cep: string) {
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function calcAge(dateStr: string) {
  const birth = new Date(dateStr + "T00:00:00");
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const TIPO_LABELS: Record<string, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  avaliacao: "Avaliação",
};

const SEXO_LABELS: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  uniao_estavel: "União estável",
};

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

export default async function PacienteDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single<Paciente>();

  if (!paciente) {
    notFound();
  }

  const { data: prontuarios } = await supabase
    .from("prontuarios")
    .select("id, data, tipo, cid, queixa_principal")
    .eq("paciente_id", id)
    .order("data", { ascending: false });

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
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Pacientes
      </Link>

      {/* Header Card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-100 text-lg font-semibold text-sky-700">
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

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/pacientes/${paciente.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton pacienteId={paciente.id} />
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Dados pessoais */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Dados pessoais
          </h2>
          <dl className="grid grid-cols-2 gap-4">
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
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Contato
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            <InfoItem label="Telefone" value={paciente.telefone ? formatPhone(paciente.telefone) : null} />
            <InfoItem label="E-mail" value={paciente.email} />
          </dl>
        </div>

        {/* Endereço */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            Endereço
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <InfoItem label="Logradouro" value={enderecoCompleto || null} />
            </div>
            <InfoItem label="Bairro" value={paciente.bairro} />
            <InfoItem label="Cidade / UF" value={cidadeEstado || null} />
            <InfoItem label="CEP" value={paciente.cep ? formatCEP(paciente.cep) : null} />
          </dl>
        </div>

        {/* Informações adicionais */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            Informações adicionais
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            <InfoItem label="Convênio" value={paciente.convenio} />
            <InfoItem label="Observações" value={paciente.observacoes} />
            <InfoItem
              label="Cadastrado em"
              value={new Date(paciente.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </dl>
        </div>
      </div>

      {/* Evoluções clínicas */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Evoluções clínicas
          </h2>
          <Link
            href={`/prontuarios/novo?paciente_id=${paciente.id}&paciente_nome=${encodeURIComponent(paciente.nome)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
                href={`/prontuarios/${pront.id}`}
                className="block rounded-lg border border-gray-100 p-4 transition-colors hover:border-gray-200 hover:bg-gray-50"
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
                  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">
            Nenhuma evolução registrada.
          </p>
        )}
      </div>
    </div>
  );
}
