import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

/** Extrai current_period_end do primeiro item da subscription (API 2026+). */
function getItemPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  if (!item) return null;
  return new Date(item.current_period_end * 1000).toISOString();
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription && session.customer) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const periodEnd = getItemPeriodEnd(subscription);
        await admin
          .from("clinicas")
          .update({
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
            subscription_status: subscription.status,
            ...(periodEnd ? { current_period_end: periodEnd } : {}),
          })
          .eq("stripe_customer_id", session.customer as string);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const periodEnd = getItemPeriodEnd(subscription);
      await admin
        .from("clinicas")
        .update({
          stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
          subscription_status: subscription.status,
          ...(periodEnd ? { current_period_end: periodEnd } : {}),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const periodEnd = getItemPeriodEnd(subscription);
      await admin
        .from("clinicas")
        .update({
          subscription_status: "canceled",
          ...(periodEnd ? { current_period_end: periodEnd } : {}),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;
      if (customerId) {
        await admin
          .from("clinicas")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
