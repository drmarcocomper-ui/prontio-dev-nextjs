"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { SENHA_MIN, SENHA_MAX, EMAIL_MAX } from "@/app/(dashboard)/configuracoes/constants";

export type SignupFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function signup(
  _prev: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  const { success, resetIn } = await rateLimit({
    key: `signup:${ip}`,
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!success) {
    const minutes = Math.ceil(resetIn / 60000);
    return {
      error: `Muitas tentativas. Tente novamente em ${minutes} minuto${minutes > 1 ? "s" : ""}.`,
    };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  const fieldErrors: Record<string, string> = {};

  if (!email) {
    fieldErrors.email = "E-mail é obrigatório.";
  } else if (email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "E-mail inválido.";
  }

  if (!password) {
    fieldErrors.password = "Senha é obrigatória.";
  } else if (password.length < SENHA_MIN) {
    fieldErrors.password = `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`;
  } else if (password.length > SENHA_MAX) {
    fieldErrors.password = `A senha deve ter no máximo ${SENHA_MAX} caracteres.`;
  }

  if (!confirmPassword) {
    fieldErrors.confirm_password = "Confirme sua senha.";
  } else if (password && password !== confirmPassword) {
    fieldErrors.confirm_password = "As senhas não coincidem.";
  }

  const aceiteTermos = formData.get("aceite_termos") === "on";
  if (!aceiteTermos) {
    fieldErrors.aceite_termos = "Você precisa aceitar os Termos de Uso e a Política de Privacidade.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    if (error.message?.includes("already registered")) {
      return { error: "Este e-mail já está cadastrado. Tente fazer login." };
    }
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  if (data?.user) {
    void logAuditEvent({
      userId: data.user.id,
      acao: "aceitar_termos",
      recurso: "consentimento",
      detalhes: {
        termos_url: "/termos",
        privacidade_url: "/privacidade",
        ip,
        user_agent: headersList.get("user-agent"),
      },
    });
  }

  redirect("/signup/confirmar");
}
