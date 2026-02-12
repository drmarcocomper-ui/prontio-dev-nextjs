export default function ProntuarioDetalhesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-24 rounded bg-gray-200" />

      {/* Header card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-4 w-36 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
              <div className="h-5 w-20 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Evolução clínica */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-4 w-32 rounded bg-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 border-t border-gray-100 pt-4 first:border-0 first:pt-0">
            <div className="h-3 w-28 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="h-3 w-56 rounded bg-gray-200" />
    </div>
  );
}
