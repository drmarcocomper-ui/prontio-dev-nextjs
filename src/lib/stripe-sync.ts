import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function syncSubscriptionQuantity(clinicaId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    // 1. Buscar dados da assinatura da clínica
    const { data: clinica } = await admin
      .from("clinicas")
      .select("stripe_subscription_id, subscription_status")
      .eq("id", clinicaId)
      .single();

    if (!clinica?.stripe_subscription_id) return;

    const status = clinica.subscription_status;
    if (status !== "active" && status !== "trialing") return;

    // 2. Contar profissionais de saúde (mínimo 1)
    const { count } = await admin
      .from("usuarios_clinicas")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", clinicaId)
      .eq("papel", "profissional_saude");

    const quantity = Math.max(1, count ?? 0);

    // 3. Buscar subscription item do Stripe
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(clinica.stripe_subscription_id);
    const item = subscription.items.data[0];
    if (!item) return;

    // 4. Só atualizar se quantidade mudou
    if (item.quantity === quantity) return;

    // 5. Atualizar quantidade (proration automática pelo Stripe)
    await stripe.subscriptionItems.update(item.id, { quantity });
  } catch (error) {
    console.error("[stripe-sync] Erro ao sincronizar quantidade:", error);
  }
}
