import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatTime, formatCurrency, getInitials, formatRelativeTime, formatDate } from "@/lib/format";
import { toDateString, parseLocalDate } from "@/lib/date";
import dynamic from "next/dynamic";

const ChartSkeleton = () => (
  <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
);
const FinanceiroChart = dynamic(
  () => import("./dashboard-charts").then((m) => ({ default: m.FinanceiroChart })),
  { loading: ChartSkeleton },
);
const AgendamentosSemanaChart = dynamic(
  () => import("./dashboard-charts").then((m) => ({ default: m.AgendamentosSemanaChart })),
  { loading: ChartSkeleton },
);
import { getClinicaAtual, getMedicoId, isProfissional, isGestor } from "@/lib/clinica";
import {
  TIPO_LABELS as _TIPO_LABELS,
  STATUS_LABELS as _STATUS_LABELS,
  STATUS_STYLES as _STATUS_STYLES,
} from "./agenda/types";

const TIPO_LABELS: Record<string, string> = _TIPO_LABELS;
const STATUS_LABELS: Record<string, string> = _STATUS_LABELS;
const STATUS_STYLES: Record<string, string> = _STATUS_STYLES;

export const metadata: Metadata = { title: "Painel" };

interface ProximaConsulta {
  id: string;
  hora_inicio: string;
  hora_fim: string;
  tipo: string | null;
  status: string;
  pacientes: {
    id: string;
    nome: string;
  };
}

interface AtividadeRecente {
  id: string;
  data: string;
  tipo: string | null;
  created_at: string;
  pacientes: {
    id: string;
    nome: string;
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) redirect("/login");
  const clinicaId = ctx.clinicaId;
  const isProfissionalSaude = isProfissional(ctx.papel);
  const temAcessoFinanceiro = isGestor(ctx.papel) || ctx.papel === "financeiro";
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    redirect("/login");
  }

  const now = new Date();
  const hoje = toDateString(now);
  const inicioMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const fimMes = toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  // Last 6 months range for chart
  const seisAtras = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const inicioSeisMeses = toDateString(seisAtras);

  // Last 7 days range for weekly chart
  const seteDiasAtras = new Date(now);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
  const inicioSemana = toDateString(seteDiasAtras);

  // Queries paralelas para os cards
  const [
    { count: totalPacientes },
    { count: consultasHoje },
    { count: atendimentosMes },
    { data: receitasMes },
    { data: proximasConsultas },
    { data: ultimosProntuarios },
    { data: transacoes6m },
    { data: agendamentosSemana },
  ] = await Promise.all([
    supabase
      .from("pacientes")
      .select("*", { count: "exact", head: true })
      .eq("medico_id", medicoId),
    supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .eq("clinica_id", clinicaId)
      .eq("data", hoje),
    supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .eq("clinica_id", clinicaId)
      .eq("status", "atendido")
      .gte("data", inicioMes)
      .lte("data", fimMes),
    temAcessoFinanceiro
      ? supabase
          .from("transacoes")
          .select("valor")
          .eq("clinica_id", clinicaId)
          .eq("tipo", "receita")
          .neq("status", "cancelado")
          .gte("data", inicioMes)
          .lte("data", fimMes)
      : { data: [] },
    supabase
      .from("agendamentos")
      .select("id, hora_inicio, hora_fim, tipo, status, pacientes(id, nome)")
      .eq("clinica_id", clinicaId)
      .eq("data", hoje)
      .not("status", "in", '("atendido","cancelado","faltou")')
      .order("hora_inicio")
      .limit(5),
    supabase
      .from("prontuarios")
      .select("id, data, tipo, created_at, pacientes(id, nome)")
      .eq("medico_id", medicoId)
      .order("created_at", { ascending: false })
      .limit(5),
    temAcessoFinanceiro
      ? supabase
          .from("transacoes")
          .select("data, tipo, valor")
          .eq("clinica_id", clinicaId)
          .neq("status", "cancelado")
          .gte("data", inicioSeisMeses)
          .lte("data", fimMes)
      : { data: [] },
    supabase
      .from("agendamentos")
      .select("data, status")
      .eq("clinica_id", clinicaId)
      .gte("data", inicioSemana)
      .lte("data", hoje),
  ]);

  const totalReceita = (receitasMes ?? []).reduce(
    (sum: number, t: { valor: number }) => sum + t.valor,
    0
  );

  // Build financial chart data (last 6 months)
  const mesesMap = new Map<string, { receitas: number; despesas: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mesesMap.set(key, { receitas: 0, despesas: 0 });
  }
  for (const t of (transacoes6m ?? []) as { data: string; tipo: string; valor: number }[]) {
    const key = t.data.slice(0, 7);
    const entry = mesesMap.get(key);
    if (entry) {
      if (t.tipo === "receita") entry.receitas += t.valor;
      else entry.despesas += t.valor;
    }
  }
  const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const financeiroChartData = Array.from(mesesMap.entries()).map(([key, val]) => ({
    mes: MESES_CURTOS[parseInt(key.split("-")[1]) - 1],
    receitas: Math.round(val.receitas * 100) / 100,
    despesas: Math.round(val.despesas * 100) / 100,
  }));

  // Build weekly appointments chart data
  const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const semanaMap = new Map<string, { total: number; atendidos: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(seteDiasAtras);
    d.setDate(d.getDate() + i);
    const key = toDateString(d);
    semanaMap.set(key, { total: 0, atendidos: 0 });
  }
  for (const a of (agendamentosSemana ?? []) as { data: string; status: string }[]) {
    const entry = semanaMap.get(a.data);
    if (entry) {
      entry.total++;
      if (a.status === "atendido") entry.atendidos++;
    }
  }
  const agendaSemanaChartData = Array.from(semanaMap.entries()).map(([key, val]) => {
    const d = parseLocalDate(key);
    return {
      dia: DIAS_CURTOS[d.getDay()],
      total: val.total,
      atendidos: val.atendidos,
    };
  });

  const proximas = (proximasConsultas ?? []) as unknown as ProximaConsulta[];
  const atividades = (ultimosProntuarios ?? []) as unknown as AtividadeRecente[];

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stats = [
    {
      label: "Pacientes",
      value: String(totalPacientes ?? 0),
      description: "cadastrados",
      icon: (
        <svg aria-hidden="true" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
    {
      label: "Consultas hoje",
      value: String(consultasHoje ?? 0),
      description: "agendadas",
      icon: (
        <svg aria-hidden="true" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
    },
    {
      label: "Atendimentos",
      value: String(atendimentosMes ?? 0),
      description: "este mês",
      icon: (
        <svg aria-hidden="true" className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
        </svg>
      ),
    },
    ...(temAcessoFinanceiro
      ? [
          {
            label: "Receita",
            value: formatCurrency(totalReceita),
            description: "este mês",
            icon: (
              <svg aria-hidden="true" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
        <p className="mt-1 text-sm capitalize text-gray-500">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`animate-slide-up rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6 stagger-${i + 1}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              {stat.icon}
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${temAcessoFinanceiro ? "lg:grid-cols-2" : ""}`}>
        {temAcessoFinanceiro && <FinanceiroChart data={financeiroChartData} />}
        <AgendamentosSemanaChart data={agendaSemanaChartData} />
      </div>

      {/* Sections */}
      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${isProfissionalSaude ? "lg:grid-cols-2" : ""}`}>
        {/* Próximas consultas */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-gray-900">
              Próximas consultas
            </h2>
          </div>
          {proximas.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {proximas.map((ag) => (
                <div key={ag.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                    {getInitials(ag.pacientes.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/pacientes/${ag.pacientes.id}`}
                      className="block truncate text-sm font-medium text-gray-900 hover:text-primary-600"
                    >
                      {ag.pacientes.nome}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatTime(ag.hora_inicio)} – {formatTime(ag.hora_fim)}</span>
                      {ag.tipo && (
                        <>
                          <span>&middot;</span>
                          <span>{TIPO_LABELS[ag.tipo] ?? ag.tipo}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[ag.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABELS[ag.status] ?? ag.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12">
              <svg aria-hidden="true" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">
                Nenhuma consulta agendada para hoje.
              </p>
              <Link
                href={`/agenda/novo?data=${hoje}`}
                className="mt-3 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                Agendar consulta →
              </Link>
            </div>
          )}
        </div>

        {/* Atividade recente (profissional de saúde only) */}
        {isProfissionalSaude && <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-gray-900">
              Atividade recente
            </h2>
          </div>
          {atividades.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {atividades.map((p) => (
                <Link key={p.id} href={`/prontuarios/${p.id}`} className="flex items-center gap-3 px-4 py-3 sm:px-6 transition-colors hover:bg-gray-50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                    {getInitials(p.pacientes.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {p.pacientes.nome}
                    </span>
                    <p className="text-xs text-gray-500">
                      {p.tipo ? (TIPO_LABELS[p.tipo] ?? p.tipo) : "Evolução"} &middot;{" "}
                      {formatDate(p.data)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatRelativeTime(p.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12">
              <svg aria-hidden="true" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">
                Nenhuma atividade registrada ainda.
              </p>
              <Link
                href="/prontuarios/novo"
                className="mt-3 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                Registrar evolução →
              </Link>
            </div>
          )}
        </div>}
      </div>
    </div>
  );
}
