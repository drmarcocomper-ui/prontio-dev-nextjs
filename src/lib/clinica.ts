import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type Papel = "superadmin" | "gestor" | "profissional_saude" | "financeiro" | "secretaria";

/** Papéis com acesso de gestão (configurações, criar usuários, etc.) */
export function isGestor(papel: Papel): boolean {
  return papel === "superadmin" || papel === "gestor";
}

/** Papéis de médico (prontuários, receitas, etc.) */
export function isProfissional(papel: Papel): boolean {
  return papel === "superadmin" || papel === "profissional_saude";
}

/** superadmin */
export function isSuperAdmin(papel: Papel): boolean {
  return papel === "superadmin";
}

/** superadmin || gestor || financeiro — acesso ao módulo financeiro */
export function isFinanceiro(papel: Papel): boolean {
  return papel === "superadmin" || papel === "gestor" || papel === "financeiro";
}

/** superadmin || gestor || profissional_saude || secretaria — atendimento/recepção */
export function isAtendimento(papel: Papel): boolean {
  return papel === "superadmin" || papel === "gestor" || papel === "profissional_saude" || papel === "secretaria";
}

export interface Clinica {
  id: string;
  nome: string;
  papel: Papel;
}

export interface ClinicaContexto {
  clinicaId: string;
  clinicaNome: string;
  papel: Papel;
  userId: string;
}

const COOKIE_NAME = "prontio_clinica_id";

/**
 * Retorna o usuário autenticado (deduplicado por request via React.cache).
 */
const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Retorna a lista de clínicas do usuário autenticado com papel.
 * Deduplicado por request via React.cache.
 */
export const getClinicasDoUsuario = cache(async (): Promise<Clinica[]> => {
  const user = await getAuthUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("usuarios_clinicas")
    .select("clinica_id, papel, clinicas(id, nome)")
    .eq("user_id", user.id);

  if (!data) return [];

  return (data as unknown as {
    clinica_id: string;
    papel: Papel;
    clinicas: { id: string; nome: string };
  }[]).map((uc) => ({
    id: uc.clinicas.id,
    nome: uc.clinicas.nome,
    papel: uc.papel,
  }));
});

/**
 * Retorna o contexto da clínica atualmente selecionada (cookie).
 * Se não há cookie, usa a primeira clínica disponível.
 * Deduplicado por request via React.cache.
 */
export const getClinicaAtual = cache(async (): Promise<ClinicaContexto | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const clinicas = await getClinicasDoUsuario();
  if (clinicas.length === 0) return null;

  const cookieStore = await cookies();
  const cookieClinicaId = cookieStore.get(COOKIE_NAME)?.value;

  const clinicaAtual = clinicas.find((c) => c.id === cookieClinicaId) ?? clinicas[0];

  return {
    clinicaId: clinicaAtual.id,
    clinicaNome: clinicaAtual.nome,
    papel: clinicaAtual.papel,
    userId: user.id,
  };
});

/**
 * Retorna todos os user_ids de médicos/superadmin da clínica atual.
 * Útil para queries que precisam filtrar por múltiplos médicos (ex: backup).
 */
export const getMedicoIdsDaClinica = cache(async (): Promise<string[]> => {
  const ctx = await getClinicaAtual();
  if (!ctx) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("usuarios_clinicas")
    .select("user_id")
    .eq("clinica_id", ctx.clinicaId)
    .in("papel", ["superadmin", "profissional_saude"]);
  return data?.map((d) => d.user_id) ?? [];
});

/**
 * Retorna o user_id do médico associado.
 * - Se o usuário logado é médico, retorna o próprio id.
 * - Se é secretária, retorna o id do médico vinculado à mesma clínica.
 */
export async function getMedicoId(): Promise<string> {
  const ctx = await getClinicaAtual();
  if (!ctx) throw new Error("Contexto de clínica não encontrado.");

  if (ctx.papel === "superadmin" || ctx.papel === "profissional_saude") return ctx.userId;

  // Outros papéis: buscar o médico da clínica (usa admin client para bypass de RLS)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from("usuarios_clinicas")
    .select("user_id")
    .eq("clinica_id", ctx.clinicaId)
    .in("papel", ["superadmin", "profissional_saude"])
    .limit(1)
    .single();

  if (!data) throw new Error("Médico não encontrado para esta clínica.");
  return data.user_id;
}

/**
 * Versão safe de getMedicoId que retorna null em vez de lançar exceção.
 * Ideal para server actions que precisam retornar { error } em vez de throw.
 */
export async function getMedicoIdSafe(): Promise<string | null> {
  try {
    return await getMedicoId();
  } catch {
    return null;
  }
}
