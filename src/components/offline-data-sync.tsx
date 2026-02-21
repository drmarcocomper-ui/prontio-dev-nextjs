"use client";

import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { createClient } from "@/lib/supabase/client";
import { cacheData } from "@/lib/offline-cache";

export function OfflineDataSync() {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) return;

    const supabase = createClient();

    async function syncData() {
      try {
        // Sync today's agenda
        const today = new Date().toISOString().split("T")[0];
        const { data: agenda } = await supabase
          .from("agendamentos")
          .select("id, data, hora_inicio, hora_fim, status, observacoes, pacientes(id, nome_completo, telefone)")
          .eq("data", today)
          .order("hora_inicio");

        if (agenda?.length) {
          await cacheData(
            "agenda",
            agenda.map((a) => ({
              ...a,
              paciente_nome: (a.pacientes as unknown as { nome_completo: string })?.nome_completo ?? "",
              paciente_telefone: (a.pacientes as unknown as { telefone: string })?.telefone ?? "",
            }))
          );
        }

        // Sync recent patients (200 most recent)
        const { data: pacientes } = await supabase
          .from("pacientes")
          .select("id, nome_completo, cpf, telefone, email, data_nascimento")
          .order("created_at", { ascending: false })
          .limit(200);

        if (pacientes?.length) {
          await cacheData("pacientes", pacientes);
        }

        // Sync recent records (50 most recent)
        const { data: prontuarios } = await supabase
          .from("prontuarios")
          .select("id, paciente_id, data_consulta, subjetivo, objetivo, avaliacao, plano, pacientes(nome_completo)")
          .order("data_consulta", { ascending: false })
          .limit(50);

        if (prontuarios?.length) {
          await cacheData(
            "prontuarios",
            prontuarios.map((p) => ({
              ...p,
              paciente_nome: (p.pacientes as unknown as { nome_completo: string })?.nome_completo ?? "",
            }))
          );
        }
      } catch {
        // Sync failed silently — cached data remains from last successful sync
      }
    }

    syncData();
  }, [isOnline]);

  return null;
}
