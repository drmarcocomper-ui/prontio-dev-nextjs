"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Registra um evento de auditoria no banco de dados.
 * Tabela: audit_logs (migration 014_audit_logs.sql)
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
