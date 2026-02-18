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

const STATUS_ICONS: Record<AgendaStatus, React.ReactNode> = {
  agendado: (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  confirmado: (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  em_atendimento: (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  atendido: (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  cancelado: (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  faltou: (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
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
  const icon = STATUS_ICONS[currentStatus];

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

  // No transitions available — render as static badge with icon
  if (allowed.length === 0) {
    const color = STATUS_STYLES[currentStatus] ?? "bg-gray-100 text-gray-600";
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
        {icon}
        {STATUS_LABELS[currentStatus] ?? currentStatus}
      </span>
    );
  }

  const selectColor = SELECT_STYLES[currentStatus] ?? "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <>
      <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${selectColor}`}>
        {icon}
        <select
          value={currentStatus}
          onChange={(e) => handleChange(e.target.value as AgendaStatus)}
          disabled={isPending}
          aria-label="Alterar status do agendamento"
          className="appearance-none bg-transparent text-xs font-medium focus:outline-none disabled:opacity-50"
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
        <svg className="h-3 w-3 opacity-50" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>

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
