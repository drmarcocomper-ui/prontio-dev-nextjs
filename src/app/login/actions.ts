"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export type LoginFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ResetSenhaFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function login(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  // Rate limit: 5 tentativas por IP a cada 15 minutos
  const { success, resetIn } = await rateLimit({ key: `login:${ip}` });

  if (!success) {
    const minutes = Math.ceil(resetIn / 60000);
    return {
      error: `Muitas tentativas de login. Tente novamente em ${minutes} minuto${minutes > 1 ? "s" : ""}.`,
    };
  }

  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function enviarResetSenha(
  _prev: ResetSenhaFormState,
  formData: FormData
): Promise<ResetSenhaFormState> {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "Informe seu e-mail." };
  }

  // Rate limit: 3 tentativas por email a cada 15 minutos
  const { success } = await rateLimit({
    key: `reset:${email.toLowerCase()}`,
    maxAttempts: 3,
  });
  if (!success) {
    // Não revela se o rate limit foi atingido (mesmo retorno de sucesso)
    return { success: true };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/login/redefinir-senha`,
  });

  if (error) {
    // Don't reveal if email exists or not
    return { success: true };
  }

  return { success: true };
}

export async function redefinirSenha(
  _prev: ResetSenhaFormState,
  formData: FormData
): Promise<ResetSenhaFormState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!password || password.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres." };
  }

  if (password.length > 100) {
    return { error: "A senha deve ter no máximo 100 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { success } = await rateLimit({ key: `redefinir_senha:${user.id}` });
    if (!success) {
      return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
    }
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Erro ao redefinir senha. O link pode ter expirado. Solicite um novo." };
  }

  return { success: true };
}
