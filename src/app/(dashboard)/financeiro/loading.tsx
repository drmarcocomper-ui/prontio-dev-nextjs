export default function FinanceiroLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-36 rounded skeleton" />
          <div className="mt-2 h-4 w-28 rounded skeleton" />
        </div>
        <div className="h-10 w-40 rounded-lg skeleton" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="h-4 w-20 rounded skeleton" />
            <div className="mt-3 h-7 w-28 rounded skeleton" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-10 w-40 rounded-lg skeleton" />
        <div className="h-10 w-32 rounded-lg skeleton" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gray-50 px-5 py-3">
          <div className="flex gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 w-16 rounded skeleton" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 border-t border-gray-200 px-5 py-4">
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-4 w-40 rounded skeleton" />
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-4 w-24 rounded skeleton" />
            <div className="h-5 w-16 rounded-full skeleton" />
            <div className="ml-auto h-4 w-20 rounded skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
