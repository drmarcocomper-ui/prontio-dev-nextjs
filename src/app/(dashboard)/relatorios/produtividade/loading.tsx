export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-7 w-64 rounded skeleton" />
          <div className="mt-3 h-8 w-48 rounded-lg skeleton" />
          <div className="mt-2 h-4 w-32 rounded skeleton" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 rounded-lg skeleton" />
          <div className="h-10 w-32 rounded-lg skeleton" />
          <div className="h-10 w-28 rounded-lg skeleton" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="h-4 w-24 rounded skeleton" />
            <div className="mt-3 h-7 w-16 rounded skeleton" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="h-4 w-36 rounded skeleton" />
            </div>
            <div className="p-6">
              <div className="h-64 w-full rounded skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="h-4 w-28 rounded skeleton" />
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="h-4 w-32 rounded skeleton" />
              <div className="flex gap-8">
                <div className="h-4 w-12 rounded skeleton" />
                <div className="h-4 w-12 rounded skeleton" />
                <div className="h-4 w-12 rounded skeleton" />
                <div className="h-4 w-20 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
