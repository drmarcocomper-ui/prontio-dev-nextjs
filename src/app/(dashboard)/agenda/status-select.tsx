"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { atualizarStatusAgendamento } from "./actions";

const STATUS_OPTIONS = [
  { value: "agendado", label: "Agendado", color: "bg-blue-100 text-blue-700" },
  { value: "confirmado", label: "Confirmado", color: "bg-sky-100 text-sky-700" },
  { value: "em_atendimento", label: "Em atendimento", color: "bg-amber-100 text-amber-700" },
  { value: "atendido", label: "Atendido", color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700" },
  { value: "faltou", label: "Faltou", color: "bg-gray-100 text-gray-600" },
];

export function StatusSelect({
  agendamentoId,
  currentStatus,
}: {
  agendamentoId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
