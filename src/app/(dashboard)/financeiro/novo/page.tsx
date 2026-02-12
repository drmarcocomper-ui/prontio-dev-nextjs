import Link from "next/link";
import { TransacaoForm } from "./transacao-form";

export default function NovaTransacaoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/financeiro"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Financeiro
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Nova transação
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <TransacaoForm />
      </div>
    </div>
  );
}
