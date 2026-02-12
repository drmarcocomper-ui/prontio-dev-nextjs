"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
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

export type ConfigFormState = {
  success?: boolean;
  error?: string;
};

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

export async function salvarConfiguracoes(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const entries: Record<string, string> = {};

  formData.forEach((value, key) => {
    if (key.startsWith("config_")) {
      entries[key.replace("config_", "")] = (value as string).trim();
    }
  });

  if (!entries.nome_consultorio) {
    return { error: "Nome do consultório é obrigatório." };
  }

  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    if (entries[field] && entries[field].length > max) {
      return { error: `Campo excede o limite de ${max} caracteres.` };
    }
  }

  const supabase = await createClient();

  const rows = Object.entries(entries).map(([chave, valor]) => ({
    chave,
    valor,
  }));

  const { error } = await supabase.from("configuracoes").upsert(rows, {
    onConflict: "chave",
  });

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "configurações") };
  }

  revalidatePath("/configuracoes");
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
