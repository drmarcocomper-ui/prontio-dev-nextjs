export default function AgendaLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-32 rounded skeleton" />
          <div className="mt-2 h-4 w-48 rounded skeleton" />
        </div>
        <div className="h-10 w-44 rounded-lg skeleton" />
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-40 rounded-lg skeleton" />
        <div className="h-10 w-36 rounded-lg skeleton" />
        <div className="h-5 w-56 rounded skeleton" />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <div className="w-24 space-y-2 text-center">
              <div className="mx-auto h-6 w-14 rounded skeleton" />
              <div className="mx-auto h-3 w-16 rounded skeleton" />
            </div>
            <div className="h-12 w-px bg-gray-200" />
            <div className="flex flex-1 items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full skeleton" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded skeleton" />
                <div className="h-3 w-24 rounded skeleton" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full skeleton" />
            <div className="h-8 w-28 rounded-lg skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
