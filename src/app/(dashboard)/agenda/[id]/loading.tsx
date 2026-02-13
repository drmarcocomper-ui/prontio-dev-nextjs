export default function AgendamentoDetalhesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="h-5 w-20 rounded skeleton" />

      {/* Header Card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full skeleton" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded skeleton" />
            <div className="h-4 w-64 rounded skeleton" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 rounded-lg skeleton" />
          <div className="h-10 w-24 rounded-lg skeleton" />
        </div>
      </div>

      {/* Details Card */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="h-5 w-48 rounded skeleton" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded skeleton" />
            <div className="h-5 w-28 rounded skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-14 rounded skeleton" />
            <div className="h-6 w-24 rounded-full skeleton" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-3 w-48 rounded skeleton" />
    </div>
  );
}
