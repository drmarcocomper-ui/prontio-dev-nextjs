export default function NovoProntuarioLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="h-4 w-24 rounded skeleton" />
        <div className="mt-2 h-8 w-40 rounded skeleton" />
      </div>

      {/* Form card */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        {/* Paciente + Data */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-2">
            <div className="h-4 w-16 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-10 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
        </div>

        {/* Tipo + CID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-10 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-8 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
        </div>

        {/* Evolução clínica */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <div className="h-4 w-28 rounded skeleton" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 rounded skeleton" />
              <div className="h-16 w-full rounded-lg skeleton" />
            </div>
          ))}
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <div className="h-4 w-20 rounded skeleton" />
          <div className="h-14 w-full rounded-lg skeleton" />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <div className="h-10 w-24 rounded-lg skeleton" />
          <div className="h-10 w-36 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
}
