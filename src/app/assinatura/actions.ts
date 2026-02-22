"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function criarCheckoutAssinatura(
  clinicaId: string,
  plano: "mensal" | "anual"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  const { getStripe, STRIPE_PRICES } = await import("@/lib/stripe");
  const stripe = getStripe();

  const priceId = plano === "anual" ? STRIPE_PRICES.anual : STRIPE_PRICES.mensal;
  if (!priceId) return { error: "Preço não configurado." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: clinica } = await admin
    .from("clinicas")
    .select("stripe_customer_id")
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/configuracoes?tab=assinatura&checkout=success`,
    cancel_url: `${siteUrl}/configuracoes?tab=assinatura`,
  });

  if (session.url) {
    redirect(session.url);
  }

  return { error: "Não foi possível criar a sessão de pagamento." };
}

export async function abrirPortalCliente(
  clinicaId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: clinica } = await admin
    .from("clinicas")
    .select("stripe_customer_id")
    .eq("id", clinicaId)
    .single();

  if (!clinica?.stripe_customer_id) {
    return { error: "Cliente Stripe não encontrado." };
  }

  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const portal = await stripe.billingPortal.sessions.create({
    customer: clinica.stripe_customer_id,
    return_url: `${siteUrl}/configuracoes?tab=assinatura`,
  });

  redirect(portal.url);
}
