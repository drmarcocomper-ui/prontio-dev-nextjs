export default function ConfiguracoesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Title */}
      <div className="h-8 w-40 rounded skeleton" />

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-24 rounded skeleton" />
        ))}
      </div>

      {/* Form card */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <div className="h-4 w-36 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-12 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 rounded skeleton" />
            <div className="h-10 w-full rounded-lg skeleton" />
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 pt-6">
          <div className="h-10 w-20 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
}
