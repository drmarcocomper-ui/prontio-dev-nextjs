const STATUS_BADGE_OPTIONS: Record<string, { label: string; color: string }> = {
  agendado: { label: "Agendado", color: "bg-blue-100 text-blue-700" },
  confirmado: { label: "Confirmado", color: "bg-sky-100 text-sky-700" },
  em_atendimento: { label: "Em atendimento", color: "bg-amber-100 text-amber-700" },
  atendido: { label: "Atendido", color: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  faltou: { label: "Faltou", color: "bg-gray-100 text-gray-600" },
};

export function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_BADGE_OPTIONS[status];
  if (!opt) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${opt.color}`}
    >
      {opt.label}
    </span>
  );
}
