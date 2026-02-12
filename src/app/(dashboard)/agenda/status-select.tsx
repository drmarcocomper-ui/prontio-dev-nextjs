"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { atualizarStatusAgendamento } from "./actions";
import { STATUS_TRANSITIONS, STATUS_LABELS } from "./types";

export function StatusSelect({
  agendamentoId,
  currentStatus,
}: {
  agendamentoId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  function handleChange(newStatus: string) {
    startTransition(async () => {
      try {
        await atualizarStatusAgendamento(agendamentoId, newStatus);
        toast.success("Status atualizado");
        router.refresh();
      } catch {
        toast.error("Erro ao atualizar status.");
      }
    });
  }

  if (allowed.length === 0) {
    return null;
  }

  return (
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
  );
}
