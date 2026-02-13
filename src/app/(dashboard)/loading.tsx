export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-24 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-56 rounded bg-gray-200" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-6 w-6 rounded bg-gray-200" />
            </div>
            <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próximas consultas */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-40 rounded bg-gray-200" />
          </div>
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
                <div className="h-5 w-16 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Atividade recente */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-36 rounded bg-gray-200" />
          </div>
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-gray-200" />
                  <div className="h-3 w-36 rounded bg-gray-200" />
                </div>
                <div className="h-3 w-12 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
