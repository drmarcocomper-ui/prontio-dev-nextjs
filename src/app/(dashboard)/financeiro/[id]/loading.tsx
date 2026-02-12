export default function TransacaoDetalhesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-24 rounded bg-gray-200" />

      {/* Header Card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-6 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-4 w-56 rounded bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-5 w-44 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-gray-200" />
              <div className="h-5 w-32 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="h-3 w-52 rounded bg-gray-200" />
    </div>
  );
}
