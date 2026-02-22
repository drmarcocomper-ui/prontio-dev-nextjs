"use client";

import { useState, useTransition } from "react";
import { iniciarCheckout, pularAssinatura } from "./actions";

export function StepPlanoForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleCheckout() {
    setError("");
    startTransition(async () => {
      const result = await iniciarCheckout();
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
      <div className="rounded-xl border-2 border-sky-500 bg-sky-50 p-5 ring-1 ring-sky-500">
        <div className="mb-1 text-sm font-medium text-gray-500">Por profissional de saúde</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">R$ 79</span>
          <span className="text-sm text-gray-500">/mês por profissional</span>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Cobrado por profissional de saúde vinculado à clínica (médicos, psicólogos, nutricionistas, etc.).
          Gestores, secretárias e financeiro não são cobrados.
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 space-y-2">
        <p className="text-sm text-gray-600">
          Você tem <span className="font-semibold text-gray-900">14 dias grátis</span> para testar o Prontio.
          A cobrança só começa após o período de teste.
        </p>
        <p className="text-sm text-gray-500">
          Durante o cadastro, a quantidade inicial será de 1 profissional (você).
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
