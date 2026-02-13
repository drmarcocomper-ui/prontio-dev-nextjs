"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export type LoginFormState = {
  error?: string;
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
  const { success, resetIn } = rateLimit({
    key: `login:${ip}`,
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });

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
