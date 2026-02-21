export default function AuditoriaLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="h-8 w-32 rounded skeleton" />
        <div className="mt-2 h-4 w-48 rounded skeleton" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-40 rounded-lg skeleton" />
        <div className="h-10 w-40 rounded-lg skeleton" />
        <div className="h-10 w-36 rounded-lg skeleton" />
        <div className="h-10 w-36 rounded-lg skeleton" />
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
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 border-t border-gray-200 px-5 py-4">
            <div className="h-4 w-28 rounded skeleton" />
            <div className="h-4 w-36 rounded skeleton" />
            <div className="h-5 w-16 rounded-full skeleton" />
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-4 w-16 rounded skeleton" />
            <div className="h-4 w-24 rounded skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
