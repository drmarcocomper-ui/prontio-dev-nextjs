import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <svg
          aria-hidden="true"
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          A página que você procura não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
