export default function NovoAgendamentoLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-5 w-28 rounded bg-gray-200" />

      {/* Title */}
      <div className="h-8 w-56 rounded bg-gray-200" />

      {/* Card */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {/* Paciente */}
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-200" />
        </div>

        {/* Data + Horários */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="h-4 w-12 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-14 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <div className="h-4 w-12 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-200" />
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-20 w-full rounded-lg bg-gray-200" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-28 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
