export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-7 w-56 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-32 rounded bg-gray-200" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 rounded-lg bg-gray-200" />
          <div className="h-10 w-32 rounded-lg bg-gray-200" />
          <div className="h-10 w-28 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-3 h-7 w-28 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Breakdown table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="h-4 w-28 rounded bg-gray-200" />
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="flex gap-8">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="h-4 w-36 rounded bg-gray-200" />
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex gap-6">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
