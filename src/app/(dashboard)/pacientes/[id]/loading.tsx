export default function PacienteDetalhesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-20 rounded bg-gray-200" />

      {/* Header card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-44 rounded bg-gray-200" />
            <div className="flex gap-3">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Info sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
            <div className="mb-4 h-4 w-28 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-4 w-28 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Prontuarios section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="mb-4 flex justify-between">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-7 w-28 rounded-lg bg-gray-200" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mt-3 rounded-lg border border-gray-100 p-4">
            <div className="flex gap-2">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
