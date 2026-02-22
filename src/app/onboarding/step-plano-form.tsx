"use client";

import { useState, useTransition } from "react";
import { iniciarCheckout, pularAssinatura } from "./actions";

const PLANOS = [
  {
    id: "mensal" as const,
    nome: "Mensal",
    preco: "R$ 149",
    periodo: "/mês",
    destaque: false,
  },
  {
    id: "anual" as const,
    nome: "Anual",
    preco: "R$ 1.190",
    periodo: "/ano",
    destaque: true,
    badge: "Economize 33%",
  },
];

export function StepPlanoForm() {
  const [planoSelecionado, setPlanoSelecionado] = useState<"mensal" | "anual">("anual");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleCheckout() {
    setError("");
    startTransition(async () => {
      const result = await iniciarCheckout(planoSelecionado);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handlePular() {
    startTransition(async () => {
      await pularAssinatura();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANOS.map((plano) => (
          <button
            key={plano.id}
            type="button"
            onClick={() => setPlanoSelecionado(plano.id)}
            className={`relative rounded-xl border-2 p-5 text-left transition-colors ${
              planoSelecionado === plano.id
                ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {plano.badge && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                {plano.badge}
              </span>
            )}
            <div className="mb-1 text-sm font-medium text-gray-500">{plano.nome}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">{plano.preco}</span>
              <span className="text-sm text-gray-500">{plano.periodo}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  planoSelecionado === plano.id
                    ? "border-sky-500 bg-sky-500"
                    : "border-gray-300"
                }`}
              >
                {planoSelecionado === plano.id && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-600">
                {planoSelecionado === plano.id ? "Selecionado" : "Selecionar"}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Você tem <span className="font-semibold text-gray-900">14 dias grátis</span> para testar o Prontio.
          A cobrança só começa após o período de teste.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processando...
            </>
          ) : (
            "Continuar para pagamento"
          )}
        </button>

        <button
          type="button"
          onClick={handlePular}
          disabled={isPending}
          className="w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
        >
          Configurar depois
        </button>
      </div>
    </div>
  );
}
