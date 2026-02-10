"use server";

import { createClient } from "@/lib/supabase/server";

export type ConfigFormState = {
  success?: boolean;
  error?: string;
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

  const supabase = await createClient();

  const rows = Object.entries(entries).map(([chave, valor]) => ({
    chave,
    valor,
  }));

  const { error } = await supabase.from("configuracoes").upsert(rows, {
    onConflict: "chave",
  });

  if (error) {
    return { error: "Erro ao salvar configurações. Tente novamente." };
  }

  return { success: true };
}

export async function alterarSenha(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
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
