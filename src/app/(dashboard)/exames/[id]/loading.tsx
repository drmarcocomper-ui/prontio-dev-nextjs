export default function ExameDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="h-4 w-48 rounded skeleton" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 rounded skeleton" />
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-lg skeleton" />
          <div className="h-10 w-24 rounded-lg skeleton" />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-24 rounded skeleton" />
            <div className="h-5 w-48 rounded skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
