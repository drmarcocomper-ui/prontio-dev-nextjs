"use client";

import Link from "next/link";

export function TrialBanner({ diasRestantes }: { diasRestantes: number }) {
  if (diasRestantes < 0) return null;

  const isUrgente = diasRestantes <= 3;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${
        isUrgente
          ? "bg-red-50 text-red-800"
          : "bg-amber-50 text-amber-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span>
          Seu período de teste termina em{" "}
          <span className="font-semibold">
            {diasRestantes === 0
              ? "menos de 1 dia"
              : diasRestantes === 1
                ? "1 dia"
                : `${diasRestantes} dias`}
          </span>
        </span>
      </div>
      <Link
        href="/configuracoes?tab=assinatura"
        className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
          isUrgente
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-amber-600 text-white hover:bg-amber-700"
        }`}
      >
        Assinar agora
      </Link>
    </div>
  );
}
