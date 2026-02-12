export default function NovaTransacaoLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div>
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="mt-2 h-8 w-44 rounded bg-gray-200" />
      </div>

      {/* Form card */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {/* Tipo */}
        <div className="space-y-2">
          <div className="h-4 w-10 rounded bg-gray-200" />
          <div className="flex gap-3">
            <div className="h-12 flex-1 rounded-lg bg-gray-200" />
            <div className="h-12 flex-1 rounded-lg bg-gray-200" />
          </div>
        </div>

        {/* Descrição + Valor */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
        </div>

        {/* Data, Categoria, Pagamento */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="h-4 w-10 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-200" />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="h-4 w-14 rounded bg-gray-200" />
          <div className="h-10 w-1/3 rounded-lg bg-gray-200" />
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-14 w-full rounded-lg bg-gray-200" />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-28 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
