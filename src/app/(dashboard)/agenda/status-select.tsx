"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";
import { atualizarStatusAgendamento } from "./actions";
import { STATUS_TRANSITIONS, STATUS_LABELS } from "./types";

const DESTRUCTIVE_STATUSES = new Set(["cancelado", "faltou"]);

export function StatusSelect({
  agendamentoId,
  currentStatus,
}: {
  agendamentoId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const router = useRouter();

  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  function executeChange(newStatus: string) {
    startTransition(async () => {
      try {
        await atualizarStatusAgendamento(agendamentoId, newStatus);
        toast.success("Status atualizado");
        router.refresh();
      } catch {
        toast.error("Erro ao atualizar status.");
      } finally {
        setConfirmStatus(null);
      }
    });
  }

  function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    if (DESTRUCTIVE_STATUSES.has(newStatus)) {
      setConfirmStatus(newStatus);
    } else {
      executeChange(newStatus);
    }
  }

  if (allowed.length === 0) {
    return null;
  }

  return (
    <>
      <select
        value={currentStatus}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        aria-label="Alterar status do agendamento"
        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
      >
        <option value={currentStatus}>
          {STATUS_LABELS[currentStatus] ?? currentStatus}
        </option>
        {allowed.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value] ?? value}
          </option>
        ))}
      </select>

      <ConfirmModal
        open={confirmStatus !== null}
        onClose={() => setConfirmStatus(null)}
        onConfirm={() => {
          if (confirmStatus) executeChange(confirmStatus);
        }}
        title={`Marcar como ${STATUS_LABELS[confirmStatus ?? ""] ?? confirmStatus}?`}
        description="Esta ação não pode ser desfeita facilmente. Deseja continuar?"
        confirmLabel="Confirmar"
        isPending={isPending}
      />
    </>
  );
}
