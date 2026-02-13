export default function AgendaLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-32 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-48 rounded bg-gray-200" />
        </div>
        <div className="h-10 w-44 rounded-lg bg-gray-200" />
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-40 rounded-lg bg-gray-200" />
        <div className="h-10 w-36 rounded-lg bg-gray-200" />
        <div className="h-5 w-56 rounded bg-gray-200" />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <div className="w-24 space-y-2 text-center">
              <div className="mx-auto h-6 w-14 rounded bg-gray-200" />
              <div className="mx-auto h-3 w-16 rounded bg-gray-200" />
            </div>
            <div className="h-12 w-px bg-gray-200" />
            <div className="flex flex-1 items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-8 w-28 rounded-lg bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
