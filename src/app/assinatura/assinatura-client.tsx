"use client";

import { useState, useTransition } from "react";
import { criarCheckoutAssinatura, abrirPortalCliente } from "./actions";

const ESTADOS = {
  trial_expirado: {
    titulo: "Período de teste encerrado",
    descricao: "Seu período de teste de 14 dias terminou. Assine o Prontio para continuar usando o sistema.",
    icone: (
      <svg className="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    botaoLabel: "Assinar agora",
    acao: "checkout" as const,
  },
  past_due: {
    titulo: "Pagamento pendente",
    descricao: "Houve um problema com o pagamento da sua assinatura. Atualize seus dados de pagamento para continuar.",
    icone: (
      <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
    botaoLabel: "Atualizar pagamento",
    acao: "portal" as const,
  },
  canceled: {
    titulo: "Assinatura encerrada",
    descricao: "Sua assinatura foi cancelada. Reative para voltar a usar o Prontio.",
    icone: (
      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    botaoLabel: "Reativar assinatura",
    acao: "checkout" as const,
  },
};

export function AssinaturaClient({
  estado,
  clinicaId,
  numProfissionais,
}: {
  estado: "trial_expirado" | "past_due" | "canceled";
  clinicaId: string;
  numProfissionais: number;
}) {
  const info = ESTADOS[estado];
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [quantidade, setQuantidade] = useState(numProfissionais);

  function handleAction() {
    setError("");
    startTransition(async () => {
      if (info.acao === "portal") {
        const result = await abrirPortalCliente(clinicaId);
        if (result?.error) setError(result.error);
      } else {
        const result = await criarCheckoutAssinatura(clinicaId, quantidade);
        if (result?.error) setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">{info.icone}</div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{info.titulo}</h1>
        <p className="mt-2 text-sm text-gray-500">{info.descricao}</p>
      </div>

      {info.acao === "checkout" && (
        <div className="rounded-xl border-2 border-sky-500 bg-sky-50 p-4 text-sm space-y-3">
          <div className="font-semibold text-gray-900">R$ 79/mês por profissional de saúde</div>
          <div className="text-gray-500">
            Gestores, secretárias e financeiro não são cobrados.
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-gray-700">Profissionais de saúde:</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.max(numProfissionais, q - 1))}
                disabled={quantidade <= numProfissionais}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </button>
              <span className="w-8 text-center text-base font-semibold text-gray-900">{quantidade}</span>
              <button
                type="button"
                onClick={() => setQuantidade((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-sky-200 pt-3">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-base font-bold text-gray-900">
              R$ {(quantidade * 79).toLocaleString("pt-BR")}/mês
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleAction}
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
          info.botaoLabel
        )}
      </button>
    </div>
  );
}
