export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Actions bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-36 rounded skeleton" />
        <div className="h-10 w-28 rounded-lg skeleton" />
      </div>

      {/* Report content */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white shadow-sm p-8">
        {/* Header */}
        <div className="border-b border-gray-300 pb-6 text-center">
          <div className="mx-auto h-6 w-48 rounded skeleton" />
          <div className="mx-auto mt-2 h-4 w-36 rounded skeleton" />
        </div>

        {/* Title */}
        <div className="text-center">
          <div className="mx-auto h-5 w-40 rounded skeleton" />
          <div className="mx-auto mt-2 h-4 w-28 rounded skeleton" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4 text-center">
              <div className="mx-auto h-3 w-16 rounded skeleton" />
              <div className="mx-auto mt-2 h-5 w-24 rounded skeleton" />
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded skeleton" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 w-24 rounded skeleton" />
              <div className="flex gap-6">
                <div className="h-4 w-20 rounded skeleton" />
                <div className="h-4 w-20 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded skeleton" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex gap-4">
                <div className="h-4 w-20 rounded skeleton" />
                <div className="h-4 w-32 rounded skeleton" />
              </div>
              <div className="h-4 w-20 rounded skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
