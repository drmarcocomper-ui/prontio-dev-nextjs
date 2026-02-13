export default function NovoPacienteLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div>
        <div className="h-4 w-20 rounded bg-gray-200" />
        <div className="mt-2 h-8 w-36 rounded bg-gray-200" />
      </div>

      {/* Form card */}
      <div className="space-y-8 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        {/* Dados pessoais */}
        <div className="space-y-4">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-200" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-10 w-full rounded-lg bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-4">
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-12 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-10 w-full rounded-lg bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-40 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
