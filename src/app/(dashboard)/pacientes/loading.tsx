export default function PacientesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 rounded skeleton" />
          <div className="mt-2 h-4 w-40 rounded skeleton" />
        </div>
        <div className="h-10 w-36 rounded-lg skeleton" />
      </div>

      {/* Search */}
      <div className="h-11 w-full rounded-lg skeleton" />

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gray-50 px-6 py-3">
          <div className="flex gap-6">
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-4 w-12 rounded skeleton" />
            <div className="h-4 w-16 rounded skeleton" />
            <div className="h-4 w-20 rounded skeleton" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full skeleton" />
              <div className="space-y-1">
                <div className="h-4 w-32 rounded skeleton" />
                <div className="h-3 w-40 rounded skeleton" />
              </div>
            </div>
            <div className="h-4 w-28 rounded skeleton" />
            <div className="h-4 w-28 rounded skeleton" />
            <div className="h-4 w-20 rounded skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
