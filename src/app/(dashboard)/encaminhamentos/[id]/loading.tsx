export default function EncaminhamentoDetalhesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="h-4 w-24 rounded skeleton" />

      {/* Header card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full skeleton" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded skeleton" />
            <div className="flex gap-2">
              <div className="h-4 w-36 rounded skeleton" />
              <div className="h-5 w-20 rounded-full skeleton" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-lg skeleton" />
          <div className="h-10 w-24 rounded-lg skeleton" />
          <div className="h-10 w-24 rounded-lg skeleton" />
        </div>
      </div>

      {/* Profissional */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="h-4 w-36 rounded skeleton" />
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="h-3 w-12 rounded skeleton" />
            <div className="h-4 w-32 rounded skeleton" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-20 rounded skeleton" />
            <div className="h-4 w-24 rounded skeleton" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-16 rounded skeleton" />
            <div className="h-4 w-28 rounded skeleton" />
          </div>
        </div>
      </div>

      {/* Motivo */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="h-4 w-40 rounded skeleton" />
        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-3/4 rounded skeleton" />
        </div>
      </div>

      {/* Footer */}
      <div className="h-3 w-56 rounded skeleton" />
    </div>
  );
}
