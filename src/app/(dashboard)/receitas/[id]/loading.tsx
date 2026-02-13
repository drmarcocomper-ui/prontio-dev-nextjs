export default function ReceitaDetalhesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-24 rounded bg-gray-200" />

      {/* Header card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-4 w-36 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-lg bg-gray-200" />
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Medicamentos */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
      </div>

      {/* Footer */}
      <div className="h-3 w-56 rounded bg-gray-200" />
    </div>
  );
}
