"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { getClinicaAtual } from "@/lib/clinica";
import { emailValido as validarEmail } from "@/lib/validators";
import {
  NOME_CONSULTORIO_MAX,
  ENDERECO_MAX,
  CIDADE_MAX,
  NOME_PROFISSIONAL_MAX,
  ESPECIALIDADE_MAX,
  CRM_MAX,
  RQE_MAX,
  EMAIL_MAX,
  SENHA_MIN,
  SENHA_MAX,
} from "./constants";
import { ESTADOS_UF } from "../pacientes/types";

export type ConfigFormState = {
  success?: boolean;
  error?: string;
};

const HORARIO_KEYS = new Set([
  "duracao_consulta", "intervalo_inicio", "intervalo_fim",
  ...["seg", "ter", "qua", "qui", "sex", "sab"].flatMap(d => [`horario_${d}_inicio`, `horario_${d}_fim`]),
]);

const PROFISSIONAL_KEYS = new Set([
  "nome_profissional", "especialidade", "crm", "rqe", "email_profissional", "cor_primaria",
]);

const FIELD_LIMITS: Record<string, number> = {
  nome_consultorio: NOME_CONSULTORIO_MAX,
  endereco_consultorio: ENDERECO_MAX,
  cidade_consultorio: CIDADE_MAX,
  nome_profissional: NOME_PROFISSIONAL_MAX,
  especialidade: ESPECIALIDADE_MAX,
  crm: CRM_MAX,
  rqe: RQE_MAX,
  email_profissional: EMAIL_MAX,
};

/**
 * Salvar dados do consultório (tabela clinicas)
 */
export async function salvarConsultorio(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome do consultório é obrigatório." };
  if (nome.length > NOME_CONSULTORIO_MAX) return { error: `Nome excede ${NOME_CONSULTORIO_MAX} caracteres.` };

  const cnpj = (formData.get("cnpj") as string)?.replace(/\D/g, "") || null;
  const telefone = (formData.get("telefone") as string)?.replace(/\D/g, "") || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string)?.trim().toUpperCase() || null;

  if (cnpj && cnpj.length !== 14) return { error: "CNPJ deve ter 14 dígitos." };
  if (telefone && (telefone.length < 10 || telefone.length > 11)) return { error: "Telefone deve ter 10 ou 11 dígitos." };
  if (endereco && endereco.length > ENDERECO_MAX) return { error: `Endereço excede ${ENDERECO_MAX} caracteres.` };
  if (cidade && cidade.length > CIDADE_MAX) return { error: `Cidade excede ${CIDADE_MAX} caracteres.` };
  if (estado && !ESTADOS_UF.includes(estado)) return { error: "Estado inválido." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("clinicas")
    .update({ nome, cnpj, telefone, endereco, cidade, estado })
    .eq("id", ctx.clinicaId);

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "consultório") };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Salvar horários de atendimento (configuracoes com clinica_id)
 */
export async function salvarHorarios(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

  const entries: { chave: string; valor: string; clinica_id: string }[] = [];

  formData.forEach((value, key) => {
    if (key.startsWith("config_")) {
      const configKey = key.replace("config_", "");
      if (!HORARIO_KEYS.has(configKey)) return;
      entries.push({ chave: configKey, valor: (value as string).trim(), clinica_id: ctx.clinicaId });
    }
  });

  if (entries.length === 0) return { success: true };

  const supabase = await createClient();

  // Delete existing horario configs for this clinic, then insert fresh
  const chaves = entries.map(e => e.chave);
  await supabase
    .from("configuracoes")
    .delete()
    .eq("clinica_id", ctx.clinicaId)
    .in("chave", chaves);

  const { error } = await supabase.from("configuracoes").insert(entries);

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "horários") };
  }

  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Salvar dados do profissional (configuracoes com user_id)
 */
export async function salvarProfissional(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Contexto não encontrado." };

  const entries: { chave: string; valor: string; user_id: string }[] = [];
  let validationError: string | null = null;

  formData.forEach((value, key) => {
    if (validationError) return;
    if (key.startsWith("config_")) {
      const configKey = key.replace("config_", "");
      if (!PROFISSIONAL_KEYS.has(configKey)) return;
      const val = (value as string).trim();
      const limit = FIELD_LIMITS[configKey];
      if (limit && val.length > limit) {
        validationError = `Campo excede ${limit} caracteres.`;
        return;
      }
      if (configKey === "email_profissional" && val) {
        const erros: Record<string, string> = {};
        validarEmail(erros, "email", val);
        if (erros.email) {
          validationError = erros.email;
          return;
        }
      }
      entries.push({ chave: configKey, valor: val, user_id: ctx.userId });
    }
  });

  if (validationError) return { error: validationError };
  if (entries.length === 0) return { success: true };

  const supabase = await createClient();

  // Delete existing profissional configs for this user, then insert fresh
  const chaves = entries.map(e => e.chave);
  await supabase
    .from("configuracoes")
    .delete()
    .eq("user_id", ctx.userId)
    .in("chave", chaves);

  const { error } = await supabase.from("configuracoes").insert(entries);

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "profissional") };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function alterarSenha(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword || newPassword.length < SENHA_MIN) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  if (newPassword.length > SENHA_MAX) {
    return { error: `A senha deve ter no máximo ${SENHA_MAX} caracteres.` };
  }

  if (newPassword !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: "Erro ao alterar senha. Tente novamente." };
  }

  return { success: true };
}

/**
 * Criar nova clínica
 */
export async function criarClinica(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome é obrigatório." };
  if (nome.length > NOME_CONSULTORIO_MAX) return { error: `Nome excede ${NOME_CONSULTORIO_MAX} caracteres.` };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  // Create clinic
  const { data: clinica, error: clinicaError } = await supabase
    .from("clinicas")
    .insert({ nome })
    .select("id")
    .single();

  if (clinicaError) {
    return { error: tratarErroSupabase(clinicaError, "criar", "clínica") };
  }

  // Create user-clinic link — preserve current user's role
  const ctx = await getClinicaAtual();
  const papel = ctx?.papel === "admin" ? "admin" : "medico";
  const { error: vinculoError } = await supabase
    .from("usuarios_clinicas")
    .insert({
      user_id: user.id,
      clinica_id: clinica.id,
      papel,
    });

  if (vinculoError) {
    return { error: tratarErroSupabase(vinculoError, "criar", "vínculo") };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Editar nome de uma clínica
 */
export async function editarClinica(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx || (ctx.papel !== "medico" && ctx.papel !== "admin")) {
    return { error: "Sem permissão para editar clínicas." };
  }

  const clinicaId = formData.get("clinica_id") as string;
  if (!clinicaId) return { error: "Clínica não identificada." };

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome é obrigatório." };
  if (nome.length > NOME_CONSULTORIO_MAX) return { error: `Nome excede ${NOME_CONSULTORIO_MAX} caracteres.` };

  const supabase = await createClient();

  const { error } = await supabase
    .from("clinicas")
    .update({ nome })
    .eq("id", clinicaId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "clínica") };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Alternar status ativo/inativo de uma clínica
 */
export async function alternarStatusClinica(id: string): Promise<void> {
  const ctx = await getClinicaAtual();
  if (!ctx || (ctx.papel !== "medico" && ctx.papel !== "admin")) {
    throw new Error("Sem permissão para alterar status de clínicas.");
  }

  const supabase = await createClient();

  const { data: clinica, error: fetchError } = await supabase
    .from("clinicas")
    .select("ativo")
    .eq("id", id)
    .single();

  if (fetchError || !clinica) {
    throw new Error("Clínica não encontrada.");
  }

  const { error } = await supabase
    .from("clinicas")
    .update({ ativo: !clinica.ativo })
    .eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "atualizar", "clínica"));
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
}

/**
 * Excluir uma clínica
 */
export async function excluirClinica(id: string): Promise<void> {
  const ctx = await getClinicaAtual();
  if (!ctx || (ctx.papel !== "medico" && ctx.papel !== "admin")) {
    throw new Error("Sem permissão para excluir clínicas.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("clinicas")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "clínica"));
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
}

/**
 * Convidar secretária por email
 */
export async function convidarSecretaria(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const email = (formData.get("email") as string)?.trim();
  const clinicaId = formData.get("clinica_id") as string;

  if (!email) return { error: "E-mail é obrigatório." };
  const emailErros: Record<string, string> = {};
  validarEmail(emailErros, "email", email);
  if (emailErros.email) return { error: emailErros.email };
  if (!clinicaId) return { error: "Selecione uma clínica." };

  const supabase = await createClient();

  // Check that caller is medico for this clinic
  const ctx = await getClinicaAtual();
  if (!ctx || (ctx.papel !== "medico" && ctx.papel !== "admin")) {
    return { error: "Apenas médicos podem convidar secretárias." };
  }
  if (clinicaId !== ctx.clinicaId) {
    return { error: "Você não tem permissão para gerenciar esta clínica." };
  }

  // Look up user by email via RPC (requires get_user_id_by_email function in Supabase)
  const { data: users, error: rpcError } = await supabase.rpc("get_user_id_by_email", { email_input: email }) as { data: { id: string }[] | null; error: unknown };

  if (rpcError) {
    return { error: "Erro ao buscar usuário. Tente novamente." };
  }

  if (!users || users.length === 0) {
    return { error: "Usuário não encontrado. A secretária precisa criar uma conta primeiro." };
  }

  const secretariaUserId = users[0].id;

  // Check if already linked
  const { data: existing } = await supabase
    .from("usuarios_clinicas")
    .select("id")
    .eq("user_id", secretariaUserId)
    .eq("clinica_id", clinicaId)
    .single();

  if (existing) {
    return { error: "Este usuário já está vinculado a esta clínica." };
  }

  const { error } = await supabase
    .from("usuarios_clinicas")
    .insert({
      user_id: secretariaUserId,
      clinica_id: clinicaId,
      papel: "secretaria",
    });

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "vínculo da secretária") };
  }

  revalidatePath("/configuracoes");
  return { success: true };
}
