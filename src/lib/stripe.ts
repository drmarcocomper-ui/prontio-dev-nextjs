import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY não está configurada.");
    }
    _stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" });
  }
  return _stripe;
}

export const STRIPE_PRICES = {
  mensal: process.env.STRIPE_PRICE_MENSAL_ID ?? "",
  anual: process.env.STRIPE_PRICE_ANUAL_ID ?? "",
} as const;
