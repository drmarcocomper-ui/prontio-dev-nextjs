"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Registra um evento de auditoria no banco de dados.
 * Usa o admin client (service_role) para bypassar RLS — auditoria é operação de sistema.
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
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      user_id: userId,
      clinica_id: clinicaId ?? null,
      acao,
      recurso,
      recurso_id: recursoId ?? null,
      detalhes: detalhes ?? null,
    });
    if (error) {
      console.error("[audit] Falha ao inserir audit_log:", error.message, error.code);
    }
  } catch {
    // Falha silenciosa — audit logging não deve bloquear operações
  }
}
