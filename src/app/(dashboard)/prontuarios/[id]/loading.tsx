export default function ProntuarioDetalhesLoading() {
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
              <div className="h-5 w-16 rounded-full skeleton" />
              <div className="h-5 w-20 rounded-full skeleton" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-lg skeleton" />
          <div className="h-10 w-24 rounded-lg skeleton" />
        </div>
      </div>

      {/* Evolução clínica */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="h-4 w-32 rounded skeleton" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 border-t border-gray-100 pt-4 first:border-0 first:pt-0">
            <div className="h-3 w-28 rounded skeleton" />
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-4 w-3/4 rounded skeleton" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="h-3 w-56 rounded skeleton" />
    </div>
  );
}
