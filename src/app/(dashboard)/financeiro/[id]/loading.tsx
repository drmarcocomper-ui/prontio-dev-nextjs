export default function TransacaoDetalhesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="h-4 w-24 rounded skeleton" />

      {/* Header Card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full skeleton" />
            <div className="h-6 w-16 rounded-full skeleton" />
          </div>
          <div className="h-6 w-48 rounded skeleton" />
          <div className="h-4 w-56 rounded skeleton" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-lg skeleton" />
          <div className="h-10 w-24 rounded-lg skeleton" />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="h-5 w-44 rounded skeleton" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded skeleton" />
              <div className="h-5 w-32 rounded skeleton" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="h-3 w-52 rounded skeleton" />
    </div>
  );
}
