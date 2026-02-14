import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type Papel = "superadmin" | "gestor" | "profissional_saude" | "financeiro" | "secretaria";

/** Papéis com acesso de gestão (configurações, criar usuários, etc.) */
export function isGestor(papel: Papel): boolean {
  return papel === "superadmin" || papel === "gestor";
}

/** Papéis de profissional de saúde (prontuários, receitas, etc.) */
export function isProfissional(papel: Papel): boolean {
  return papel === "superadmin" || papel === "profissional_saude";
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
 * Retorna a lista de clínicas do usuário autenticado com papel.
 */
export async function getClinicasDoUsuario(): Promise<Clinica[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
}

/**
 * Retorna o contexto da clínica atualmente selecionada (cookie).
 * Se não há cookie, usa a primeira clínica disponível.
 */
export async function getClinicaAtual(): Promise<ClinicaContexto | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
}

/**
 * Retorna o user_id do médico associado.
 * - Se o usuário logado é médico, retorna o próprio id.
 * - Se é secretária, retorna o id do médico vinculado à mesma clínica.
 */
export async function getMedicoId(): Promise<string> {
  const ctx = await getClinicaAtual();
  if (!ctx) throw new Error("Contexto de clínica não encontrado.");

  if (ctx.papel === "superadmin" || ctx.papel === "profissional_saude") return ctx.userId;

  // Outros papéis: buscar o profissional de saúde da clínica (usa admin client para bypass de RLS)
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
