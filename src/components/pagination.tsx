"use client";

import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) {
      params.delete("pagina");
    } else {
      params.set("pagina", String(page));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3"
    >
      <p className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> de{" "}
        <span className="font-medium">{totalItems}</span>
      </p>

      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Anterior
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-400">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Anterior
          </span>
        )}

        <span className="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Próximo
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-400">
            Próximo
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </span>
        )}
      </div>
    </nav>
  );
}
