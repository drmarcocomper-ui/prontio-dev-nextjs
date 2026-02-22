"use client";

import { useState, useTransition } from "react";
import { criarCheckoutAssinatura, abrirPortalCliente } from "@/app/assinatura/actions";

interface AssinaturaTabProps {
  clinicaId: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  numProfissionais: number;
}

const STATUS_LABELS: Record<string, { label: string; cor: string }> = {
  active: { label: "Ativa", cor: "bg-emerald-100 text-emerald-700" },
  trialing: { label: "Período de teste", cor: "bg-blue-100 text-blue-700" },
  past_due: { label: "Pagamento pendente", cor: "bg-red-100 text-red-700" },
  canceled: { label: "Cancelada", cor: "bg-gray-100 text-gray-700" },
  unpaid: { label: "Não paga", cor: "bg-red-100 text-red-700" },
  incomplete: { label: "Incompleta", cor: "bg-amber-100 text-amber-700" },
};

export function AssinaturaTab({
  clinicaId,
  subscriptionStatus,
  trialEndsAt,
  currentPeriodEnd,
  numProfissionais,
}: AssinaturaTabProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const status = subscriptionStatus;
  const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const now = new Date();
  const emTrial = !status && trialEnd && trialEnd > now;
  const diasRestantes = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const statusInfo = status ? STATUS_LABELS[status] : null;

  const temAssinatura = status === "active" || status === "trialing" || status === "past_due";

  const totalMensal = numProfissionais * 79;

  function handleCheckout() {
    setError("");
    startTransition(async () => {
      const result = await criarCheckoutAssinatura(clinicaId);
      if (result?.error) setError(result.error);
    });
  }

  function handlePortal() {
    setError("");
    startTransition(async () => {
      const result = await abrirPortalCliente(clinicaId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Assinatura</h2>
        <p className="mt-1 text-sm text-gray-500">Gerencie seu plano e pagamentos.</p>
      </div>

      {/* Status atual */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Status</span>
          {statusInfo ? (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.cor}`}>
              {statusInfo.label}
            </span>
          ) : emTrial ? (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Período de teste
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              Sem assinatura
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Plano</span>
          <span className="text-sm text-gray-900">R$ 79/mês por profissional</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Profissionais de saúde</span>
          <span className="text-sm text-gray-900">{numProfissionais}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total mensal estimado</span>
          <span className="text-sm font-semibold text-gray-900">
            R$ {totalMensal.toLocaleString("pt-BR")}/mês
          </span>
        </div>

        {emTrial && diasRestantes !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Trial termina em</span>
            <span className="text-sm text-gray-900">
              {diasRestantes <= 0 ? "Hoje" : `${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}`}
            </span>
          </div>
        )}

        {periodEnd && status === "active" && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Próxima cobrança</span>
            <span className="text-sm text-gray-900">
              {periodEnd.toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Ações */}
      {temAssinatura ? (
        <button
          type="button"
          onClick={handlePortal}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Abrindo...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
              Gerenciar assinatura
            </>
          )}
        </button>
      ) : (
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
            "Assinar agora"
          )}
        </button>
      )}
    </div>
  );
}
