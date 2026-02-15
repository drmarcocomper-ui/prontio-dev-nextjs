export default function NovoAgendamentoLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="h-5 w-28 rounded skeleton" />

      {/* Title */}
      <div className="h-8 w-56 rounded skeleton" />

      {/* Card */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        {/* Paciente */}
        <div className="space-y-2">
          <div className="h-4 w-20 rounded skeleton" />
          <div className="h-10 w-full rounded-lg skeleton" />
        </div>

        {/* Data + Horário */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-12 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-14 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <div className="h-4 w-12 rounded skeleton" />
          <div className="h-10 w-full rounded-lg skeleton" />
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded skeleton" />
          <div className="h-20 w-full rounded-lg skeleton" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
          <div className="h-10 w-24 rounded-lg skeleton" />
          <div className="h-10 w-28 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
}
