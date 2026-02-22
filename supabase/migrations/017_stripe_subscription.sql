-- Adiciona colunas de assinatura Stripe na tabela clinicas
alter table clinicas
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text unique,
  add column stripe_price_id text,
  add column subscription_status text
    check (subscription_status is null or subscription_status in ('trialing','active','past_due','canceled','unpaid','incomplete')),
  add column trial_ends_at timestamptz,
  add column current_period_end timestamptz;
