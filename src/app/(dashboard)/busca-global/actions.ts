"use server";

import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual, isProfissional } from "@/lib/clinica";
import { escapeLikePattern } from "@/lib/sanitize";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  module: string;
}

export interface SearchResults {
  pacientes: SearchResult[];
  agendamentos: SearchResult[];
  prontuarios: SearchResult[];
  receitas: SearchResult[];
  exames: SearchResult[];
}

const MAX_PER_MODULE = 5;

export async function buscaGlobal(term: string): Promise<SearchResults> {
  const ctx = await getClinicaAtual();
  if (!ctx || term.length < 2) {
    return { pacientes: [], agendamentos: [], prontuarios: [], receitas: [], exames: [] };
  }

  const supabase = await createClient();
  const escaped = escapeLikePattern(term);
  const profissional = isProfissional(ctx.papel);

  // Run all queries in parallel
  type PacRow = { id: string; nome: string; cpf: string | null; telefone: string | null };
  type AgRow = { id: string; data: string; hora_inicio: string; pacientes: { id: string; nome: string } | null };
  type PronRow = { id: string; created_at: string; pacientes: { id: string; nome: string } | null };
  type RecRow = PronRow;
  type ExRow = PronRow;

  const pacientesPromise = supabase
    .from("pacientes")
    .select("id, nome, cpf, telefone")
    .or(`nome.ilike.%${escaped}%,cpf.ilike.%${escaped}%`)
    .order("nome")
    .limit(MAX_PER_MODULE)
    .then((r) => (r.data ?? []) as PacRow[]);

  const agendamentosPromise = supabase
    .from("agendamentos")
    .select("id, data, hora_inicio, pacientes(id, nome)")
    .or(`pacientes.nome.ilike.%${escaped}%`)
    .order("data", { ascending: false })
    .limit(MAX_PER_MODULE)
    .then((r) => ((r.data ?? []) as unknown as AgRow[]));

  const prontuariosPromise = profissional
    ? supabase
        .from("prontuarios")
        .select("id, created_at, pacientes(id, nome)")
        .or(`subjetivo.ilike.%${escaped}%,avaliacao.ilike.%${escaped}%,pacientes.nome.ilike.%${escaped}%`)
        .order("created_at", { ascending: false })
        .limit(MAX_PER_MODULE)
        .then((r) => ((r.data ?? []) as unknown as PronRow[]))
    : Promise.resolve([] as PronRow[]);

  const receitasPromise = profissional
    ? supabase
        .from("receitas")
        .select("id, created_at, pacientes(id, nome)")
        .or(`pacientes.nome.ilike.%${escaped}%`)
        .order("created_at", { ascending: false })
        .limit(MAX_PER_MODULE)
        .then((r) => ((r.data ?? []) as unknown as RecRow[]))
    : Promise.resolve([] as RecRow[]);

  const examesPromise = profissional
    ? supabase
        .from("solicitacoes_exames")
        .select("id, created_at, pacientes(id, nome)")
        .or(`pacientes.nome.ilike.%${escaped}%`)
        .order("created_at", { ascending: false })
        .limit(MAX_PER_MODULE)
        .then((r) => ((r.data ?? []) as unknown as ExRow[]))
    : Promise.resolve([] as ExRow[]);

  // Wrap PromiseLike into real Promise for .catch support
  const safe = <T,>(p: PromiseLike<T[]>): Promise<T[]> =>
    Promise.resolve(p).catch(() => [] as T[]);

  const [pacRows, agRows, pronRows, recRows, exRows] = await Promise.all([
    safe(pacientesPromise),
    safe(agendamentosPromise),
    safe(prontuariosPromise),
    safe(receitasPromise),
    safe(examesPromise),
  ]);

  const pacientes: SearchResult[] = pacRows.map((p) => ({
    id: p.id,
    title: p.nome,
    subtitle: p.cpf ? formatCPF(p.cpf) : (p.telefone ?? ""),
    href: `/pacientes/${p.id}`,
    module: "Pacientes",
  }));

  const agendamentos: SearchResult[] = agRows
    .filter((a) => a.pacientes)
    .map((a) => ({
      id: a.id,
      title: a.pacientes!.nome,
      subtitle: `${formatDateBR(a.data)} às ${a.hora_inicio.slice(0, 5)}`,
      href: `/agenda/${a.id}`,
      module: "Agenda",
    }));

  const prontuarios: SearchResult[] = pronRows
    .filter((p) => p.pacientes)
    .map((p) => ({
      id: p.id,
      title: p.pacientes!.nome,
      subtitle: `Prontuário — ${formatDateBR(p.created_at.slice(0, 10))}`,
      href: `/prontuarios/${p.id}`,
      module: "Prontuários",
    }));

  const receitas: SearchResult[] = recRows
    .filter((r) => r.pacientes)
    .map((r) => ({
      id: r.id,
      title: r.pacientes!.nome,
      subtitle: `Receita — ${formatDateBR(r.created_at.slice(0, 10))}`,
      href: `/receitas/${r.id}`,
      module: "Receitas",
    }));

  const exames: SearchResult[] = exRows
    .filter((e) => e.pacientes)
    .map((e) => ({
      id: e.id,
      title: e.pacientes!.nome,
      subtitle: `Exame — ${formatDateBR(e.created_at.slice(0, 10))}`,
      href: `/exames/${e.id}`,
      module: "Exames",
    }));

  return { pacientes, agendamentos, prontuarios, receitas, exames };
}

function formatCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
