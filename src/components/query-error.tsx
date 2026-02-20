interface QueryErrorProps {
  title: string;
  message?: string;
}

export function QueryError({
  title,
  message = "Não foi possível carregar os dados. Tente recarregar a página.",
}: QueryErrorProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {message}
      </div>
    </div>
  );
}
