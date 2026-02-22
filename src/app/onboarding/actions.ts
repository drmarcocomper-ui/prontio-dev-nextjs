"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import {
  NOME_CONSULTORIO_MAX,
  ENDERECO_MAX,
  CIDADE_MAX,
  CNPJ_MAX,
  TELEFONE_MAX,
  NOME_PROFISSIONAL_MAX,
  ESPECIALIDADE_MAX,
  CRM_MAX,
  RQE_MAX,
} from "@/app/(dashboard)/configuracoes/constants";
import { ESTADOS_UF } from "@/app/(dashboard)/pacientes/types";
import { uuidValido } from "@/lib/validators";

export type OnboardingFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ============================================
// Step 1: Criar clínica (obrigatório)
// ============================================

export async function criarClinicaOnboarding(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  const { success: allowed } = await rateLimit({
    key: `onboarding_clinica:${user.id}`,
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  // Check if user already has a clinic (prevent duplicates)
  const { data: existingVinculo } = await supabase
    .from("usuarios_clinicas")
    .select("clinica_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (existingVinculo) {
    redirect("/onboarding?step=2");
  }

  // Validate fields
  const nome = (formData.get("nome") as string)?.trim();
  const cnpj = (formData.get("cnpj") as string)?.replace(/\D/g, "") || null;
  const telefone = (formData.get("telefone") as string)?.replace(/\D/g, "") || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string)?.trim().toUpperCase() || null;

  const fieldErrors: Record<string, string> = {};

  if (!nome) {
    fieldErrors.nome = "Nome do consultório é obrigatório.";
  } else if (nome.length > NOME_CONSULTORIO_MAX) {
    fieldErrors.nome = `Nome excede ${NOME_CONSULTORIO_MAX} caracteres.`;
  }

  if (cnpj && cnpj.length !== 14) {
    fieldErrors.cnpj = "CNPJ deve ter 14 dígitos.";
  }
  if (cnpj && String(cnpj).length > CNPJ_MAX) {
    fieldErrors.cnpj = "CNPJ inválido.";
  }

  if (telefone && (telefone.length < 8 || telefone.length > 11)) {
    fieldErrors.telefone = "Telefone deve ter entre 8 e 11 dígitos.";
  }
  if (telefone && String(telefone).length > TELEFONE_MAX) {
    fieldErrors.telefone = "Telefone inválido.";
  }

  if (endereco && endereco.length > ENDERECO_MAX) {
    fieldErrors.endereco = `Endereço excede ${ENDERECO_MAX} caracteres.`;
  }

  if (cidade && cidade.length > CIDADE_MAX) {
    fieldErrors.cidade = `Cidade excede ${CIDADE_MAX} caracteres.`;
  }

  if (estado && !ESTADOS_UF.includes(estado)) {
    fieldErrors.estado = "Estado inválido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Use admin client to bypass RLS (user has no clinic yet)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // Insert clinic
  const { data: clinica, error: clinicaError } = await admin
    .from("clinicas")
    .insert({
      nome,
      cnpj,
      telefone,
      endereco,
      cidade,
      estado,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (clinicaError) {
    return { error: tratarErroSupabase(clinicaError, "criar", "clínica") };
  }

  // Insert user-clinic link
  const { error: vinculoError } = await admin
    .from("usuarios_clinicas")
    .insert({
      user_id: user.id,
      clinica_id: clinica.id,
      papel: "gestor",
    });

  if (vinculoError) {
    // Rollback: delete the clinic
    await admin.from("clinicas").delete().eq("id", clinica.id);
    return { error: tratarErroSupabase(vinculoError, "criar", "vínculo") };
  }

  // Set cookies
  const cookieStore = await cookies();
  cookieStore.set("prontio_clinica_id", clinica.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  cookieStore.set("prontio_onboarding", "pending", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24h
  });

  void logAuditEvent({
    userId: user.id,
    clinicaId: clinica.id,
    acao: "criar",
    recurso: "clinica",
    recursoId: clinica.id,
    detalhes: { nome, origem: "onboarding" },
  });

  redirect("/onboarding?step=2");
}

// ============================================
// Step 2: Salvar perfil profissional (opcional)
// ============================================

export async function salvarProfissionalOnboarding(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  const { success: allowed } = await rateLimit({
    key: `onboarding_profissional:${user.id}`,
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const nomeProfissional = (formData.get("nome_profissional") as string)?.trim() || "";
  const especialidade = (formData.get("especialidade") as string)?.trim() || "";
  const crm = (formData.get("crm") as string)?.trim() || "";
  const rqe = (formData.get("rqe") as string)?.trim() || "";

  if (nomeProfissional.length > NOME_PROFISSIONAL_MAX) {
    return { fieldErrors: { nome_profissional: `Nome excede ${NOME_PROFISSIONAL_MAX} caracteres.` } };
  }
  if (especialidade.length > ESPECIALIDADE_MAX) {
    return { fieldErrors: { especialidade: `Especialidade excede ${ESPECIALIDADE_MAX} caracteres.` } };
  }
  if (crm.length > CRM_MAX) {
    return { fieldErrors: { crm: `CRM excede ${CRM_MAX} caracteres.` } };
  }
  if (rqe.length > RQE_MAX) {
    return { fieldErrors: { rqe: `RQE excede ${RQE_MAX} caracteres.` } };
  }

  const entries = [
    { chave: "nome_profissional", valor: nomeProfissional, user_id: user.id },
    { chave: "especialidade", valor: especialidade, user_id: user.id },
    { chave: "crm", valor: crm, user_id: user.id },
    { chave: "rqe", valor: rqe, user_id: user.id },
  ].filter((e) => e.valor);

  if (entries.length > 0) {
    const chaves = entries.map((e) => e.chave);

    const { error: deleteError } = await supabase
      .from("configuracoes")
      .delete()
      .eq("user_id", user.id)
      .in("chave", chaves);

    if (deleteError) {
      return { error: tratarErroSupabase(deleteError, "salvar", "profissional") };
    }

    const { error } = await supabase.from("configuracoes").insert(entries);

    if (error) {
      return { error: tratarErroSupabase(error, "salvar", "profissional") };
    }
  }

  redirect("/onboarding?step=3");
}

// ============================================
// Step 3: Salvar horários (opcional)
// ============================================

export async function salvarHorariosOnboarding(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  const { success: allowed } = await rateLimit({
    key: `onboarding_horarios:${user.id}`,
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const cookieStore = await cookies();
  const clinicaId = cookieStore.get("prontio_clinica_id")?.value;
  if (!clinicaId || !uuidValido(clinicaId)) return { error: "Clínica não encontrada. Volte ao passo 1." };

  const duracao = parseInt(formData.get("duracao_consulta") as string, 10);
  if (isNaN(duracao) || duracao < 5 || duracao > 240) {
    return { error: "Duração deve ser entre 5 e 240 minutos." };
  }

  const DIAS_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const DIAS_LABELS: Record<string, string> = {
    dom: "Domingo", seg: "Segunda", ter: "Terça", qua: "Quarta",
    qui: "Quinta", sex: "Sexta", sab: "Sábado",
  };
  const TIME_RE = /^\d{2}:\d{2}$/;

  const rows: {
    clinica_id: string;
    user_id: string;
    dia_semana: number;
    ativo: boolean;
    hora_inicio: string | null;
    hora_fim: string | null;
    intervalo_inicio: string | null;
    intervalo_fim: string | null;
    duracao_consulta: number;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const key = DIAS_KEYS[i];
    const ativo = formData.get(`ativo_${key}`) === "true";
    const hora_inicio = (formData.get(`hora_inicio_${key}`) as string) || null;
    const hora_fim = (formData.get(`hora_fim_${key}`) as string) || null;
    const intervalo_inicio = (formData.get(`intervalo_inicio_${key}`) as string) || null;
    const intervalo_fim = (formData.get(`intervalo_fim_${key}`) as string) || null;

    if (ativo) {
      if (!hora_inicio || !hora_fim) {
        return { error: `Horário de início e fim são obrigatórios para ${DIAS_LABELS[key]}.` };
      }
      if (!TIME_RE.test(hora_inicio) || !TIME_RE.test(hora_fim)) {
        return { error: `Formato de horário inválido para ${DIAS_LABELS[key]}.` };
      }
      if (hora_fim <= hora_inicio) {
        return { error: `Horário de término deve ser posterior ao início (${DIAS_LABELS[key]}).` };
      }
      if (intervalo_inicio && !TIME_RE.test(intervalo_inicio)) {
        return { error: `Formato de intervalo inválido para ${DIAS_LABELS[key]}.` };
      }
      if (intervalo_fim && !TIME_RE.test(intervalo_fim)) {
        return { error: `Formato de intervalo inválido para ${DIAS_LABELS[key]}.` };
      }
      if (intervalo_inicio && intervalo_fim && intervalo_fim <= intervalo_inicio) {
        return { error: `Intervalo inválido para ${DIAS_LABELS[key]}.` };
      }
    }

    rows.push({
      clinica_id: clinicaId,
      user_id: user.id,
      dia_semana: i,
      ativo,
      hora_inicio: ativo ? hora_inicio : null,
      hora_fim: ativo ? hora_fim : null,
      intervalo_inicio: ativo ? intervalo_inicio : null,
      intervalo_fim: ativo ? intervalo_fim : null,
      duracao_consulta: duracao,
    });
  }

  const { error } = await supabase.from("horarios_profissional").upsert(rows, {
    onConflict: "clinica_id,user_id,dia_semana",
  });

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "horários") };
  }

  revalidatePath("/agenda");
  redirect("/onboarding?step=4");
}

// ============================================
// Step 4: Iniciar checkout Stripe
// ============================================

export async function iniciarCheckout(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  const { success: allowed } = await rateLimit({
    key: `onboarding_checkout:${user.id}`,
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const cookieStore = await cookies();
  const clinicaId = cookieStore.get("prontio_clinica_id")?.value;
  if (!clinicaId) return { error: "Clínica não encontrada." };

  const { getStripe, STRIPE_PRICES } = await import("@/lib/stripe");
  const stripe = getStripe();

  const priceId = STRIPE_PRICES.por_profissional;
  if (!priceId) return { error: "Preço não configurado." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // Contar profissionais de saúde da clínica (mínimo 1)
  const { count: profCount } = await admin
    .from("usuarios_clinicas")
    .select("id", { count: "exact", head: true })
    .eq("clinica_id", clinicaId)
    .eq("papel", "profissional_saude");

  const numProfissionais = Math.max(1, profCount ?? 0);

  // Buscar ou criar Stripe Customer
  const { data: clinica } = await admin
    .from("clinicas")
    .select("stripe_customer_id, trial_ends_at")
    .eq("id", clinicaId)
    .single();

  let customerId = clinica?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { clinica_id: clinicaId },
    });
    customerId = customer.id;

    await admin
      .from("clinicas")
      .update({ stripe_customer_id: customerId })
      .eq("id", clinicaId);
  }

  // Calcular trial restante para sincronizar com Stripe
  const trialEndsAt = clinica?.trial_ends_at ? new Date(clinica.trial_ends_at) : null;
  const now = new Date();
  const trialEndUnix = trialEndsAt && trialEndsAt > now
    ? Math.floor(trialEndsAt.getTime() / 1000)
    : undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{
      price: priceId,
      quantity: numProfissionais,
      adjustable_quantity: { enabled: true, minimum: numProfissionais },
    }],
    ...(trialEndUnix ? { subscription_data: { trial_end: trialEndUnix } } : {}),
    success_url: `${siteUrl}/onboarding/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/onboarding?step=4`,
  });

  // Limpar cookie de onboarding
  cookieStore.delete("prontio_onboarding");

  if (session.url) {
    redirect(session.url);
  }

  return { error: "Não foi possível criar a sessão de pagamento." };
}

// ============================================
// Step 4: Pular assinatura (continuar com trial)
// ============================================

export async function pularAssinatura(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  cookieStore.delete("prontio_onboarding");
  redirect("/");
}
