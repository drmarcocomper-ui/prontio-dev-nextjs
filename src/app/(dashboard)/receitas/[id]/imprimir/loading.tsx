export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      {/* Actions bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-36 rounded bg-gray-200" />
        <div className="h-10 w-28 rounded-lg bg-gray-200" />
      </div>

      {/* Receita */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        {/* Header Consultório */}
        <div className="border-b border-gray-300 pb-6 text-center">
          <div className="mx-auto h-6 w-48 rounded bg-gray-200" />
          <div className="mx-auto mt-1 h-4 w-64 rounded bg-gray-200" />
          <div className="mx-auto mt-1 h-4 w-36 rounded bg-gray-200" />
        </div>

        {/* Tipo da receita + data */}
        <div className="mt-6 text-center">
          <div className="mx-auto h-5 w-40 rounded bg-gray-200" />
          <div className="mx-auto mt-1 h-4 w-28 rounded bg-gray-200" />
        </div>

        {/* Dados do Paciente */}
        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="mt-1 h-4 w-36 rounded bg-gray-200" />
        </div>

        {/* Medicamentos */}
        <div className="mt-6">
          <div className="h-3 w-28 rounded bg-gray-200" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-4/6 rounded bg-gray-200" />
          </div>
        </div>

        {/* Observações */}
        <div className="mt-6">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="mt-2 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
          </div>
        </div>

        {/* Assinatura */}
        <div className="mt-12 border-t border-gray-300 pt-6 text-center">
          <div className="mx-auto w-64 border-b border-gray-400 pb-2" />
          <div className="mx-auto mt-2 h-4 w-36 rounded bg-gray-200" />
          <div className="mx-auto mt-1 h-4 w-28 rounded bg-gray-200" />
          <div className="mx-auto mt-1 h-4 w-24 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
