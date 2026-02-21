"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Registra um evento de auditoria no banco de dados.
 *
 * Tabela necessária (criar no Supabase se não existir):
 *
 * create table audit_logs (
 *   id         uuid primary key default gen_random_uuid(),
 *   user_id    uuid not null references auth.users(id),
 *   clinica_id uuid references clinicas(id),
 *   acao       text not null,
 *   recurso    text not null,
 *   recurso_id text,
 *   detalhes   jsonb,
 *   created_at timestamptz not null default now()
 * );
 *
 * create index audit_logs_user_idx on audit_logs (user_id);
 * create index audit_logs_clinica_idx on audit_logs (clinica_id);
 * create index audit_logs_created_idx on audit_logs (created_at desc);
 * alter table audit_logs enable row level security;
 * create policy "Admin acessa audit_logs" on audit_logs for all to authenticated
 *   using (public.is_admin());
 */
export async function logAuditEvent({
  userId,
  clinicaId,
  acao,
  recurso,
  recursoId,
  detalhes,
}: {
  userId: string;
  clinicaId?: string;
  acao: string;
  recurso: string;
  recursoId?: string;
  detalhes?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      user_id: userId,
      clinica_id: clinicaId ?? null,
      acao,
      recurso,
      recurso_id: recursoId ?? null,
      detalhes: detalhes ?? null,
    });
  } catch {
    // Falha silenciosa — audit logging não deve bloquear operações
  }
}
