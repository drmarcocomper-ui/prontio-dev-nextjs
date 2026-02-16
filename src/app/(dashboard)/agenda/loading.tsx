export default function AgendaLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-32 rounded skeleton" />
          <div className="mt-2 h-4 w-48 rounded skeleton" />
        </div>
        <div className="h-10 w-44 rounded-lg skeleton" />
      </div>

      {/* Date picker + Filters */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-40 rounded-lg skeleton" />
        <div className="h-10 w-36 rounded-lg skeleton" />
      </div>

      {/* Time Grid skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center ${i < 9 ? "border-b border-gray-100" : ""}`}
          >
            <div className="w-16 shrink-0 py-3 text-center sm:w-20">
              <div className="mx-auto h-4 w-10 rounded skeleton" />
            </div>
            <div className="flex-1 py-3 pr-4">
              {i % 3 === 1 ? (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full skeleton" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 rounded skeleton" />
                    <div className="h-3 w-20 rounded skeleton" />
                  </div>
                </div>
              ) : (
                <div className="h-4 w-0 rounded" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
