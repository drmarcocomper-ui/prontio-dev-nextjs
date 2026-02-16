"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";
import { atualizarStatusAgendamento } from "./actions";
import { STATUS_TRANSITIONS, STATUS_LABELS, STATUS_STYLES, type AgendaStatus } from "./types";

const DESTRUCTIVE_STATUSES = new Set<AgendaStatus>(["cancelado", "faltou"]);

const SELECT_STYLES: Record<AgendaStatus, string> = {
  agendado: "bg-blue-50 text-blue-700 border-blue-200",
  confirmado: "bg-blue-50 text-blue-700 border-blue-200",
  em_atendimento: "bg-amber-50 text-amber-700 border-amber-200",
  atendido: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelado: "bg-red-50 text-red-700 border-red-200",
  faltou: "bg-gray-50 text-gray-600 border-gray-200",
};

export function StatusSelect({
  agendamentoId,
  currentStatus,
}: {
  agendamentoId: string;
  currentStatus: AgendaStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmStatus, setConfirmStatus] = useState<AgendaStatus | null>(null);
  const router = useRouter();

  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  function executeChange(newStatus: AgendaStatus) {
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

  function handleChange(newStatus: AgendaStatus) {
    if (newStatus === currentStatus) return;
    if (DESTRUCTIVE_STATUSES.has(newStatus)) {
      setConfirmStatus(newStatus);
    } else {
      executeChange(newStatus);
    }
  }

  // No transitions available — render as static badge
  if (allowed.length === 0) {
    const color = STATUS_STYLES[currentStatus] ?? "bg-gray-100 text-gray-600";
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
        {STATUS_LABELS[currentStatus] ?? currentStatus}
      </span>
    );
  }

  const selectColor = SELECT_STYLES[currentStatus] ?? "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <>
      <select
        value={currentStatus}
        onChange={(e) => handleChange(e.target.value as AgendaStatus)}
        disabled={isPending}
        aria-label="Alterar status do agendamento"
        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 ${selectColor}`}
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
        title={`Marcar como ${confirmStatus ? STATUS_LABELS[confirmStatus] : ""}?`}
        description="Esta ação não pode ser desfeita facilmente. Deseja continuar?"
        confirmLabel="Confirmar"
        isPending={isPending}
      />
    </>
  );
}
