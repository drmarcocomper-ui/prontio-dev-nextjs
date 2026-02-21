import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Verifique seu e-mail" };

export default function ConfirmarPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Verifique seu e-mail
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enviamos um link de confirmação para o seu e-mail. Clique no link para ativar sua conta e começar a configurar seu consultório.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
