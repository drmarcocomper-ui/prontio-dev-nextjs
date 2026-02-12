export default function ProntuariosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-36 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-gray-200" />
      </div>

      {/* Search */}
      <div className="h-11 w-full rounded-lg bg-gray-200" />

      {/* Cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-gray-200" />
                <div className="h-5 w-20 rounded-full bg-gray-200" />
              </div>
              <div className="h-4 w-3/4 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
