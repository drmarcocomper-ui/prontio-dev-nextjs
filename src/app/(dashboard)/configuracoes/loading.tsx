export default function ConfiguracoesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* Title */}
      <div className="h-8 w-40 rounded bg-gray-200" />

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-24 rounded bg-gray-200" />
        ))}
      </div>

      {/* Form card */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-12 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 pt-6">
          <div className="h-10 w-20 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
