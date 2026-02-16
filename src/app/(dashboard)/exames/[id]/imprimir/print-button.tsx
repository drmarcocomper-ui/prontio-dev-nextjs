"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function PrintActions({
  id,
  defaultFormato,
  defaultOperadora,
  defaultCarteirinha,
  defaultRegistroANS,
}: {
  id: string;
  defaultFormato: string;
  defaultOperadora: string;
  defaultCarteirinha: string;
  defaultRegistroANS: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formato = searchParams.get("formato") || defaultFormato;
  const isSADT = formato === "sadt";

  const [operadora, setOperadora] = useState(defaultOperadora);
  const [carteirinha, setCarteirinha] = useState(defaultCarteirinha);
  const [registroANS, setRegistroANS] = useState(defaultRegistroANS);

  function navigateToFormato(fmt: string) {
    const params = new URLSearchParams();
    params.set("formato", fmt);
    if (fmt === "sadt") {
      if (operadora) params.set("operadora", operadora);
      if (carteirinha) params.set("carteirinha", carteirinha);
      if (registroANS) params.set("registro_ans", registroANS);
    }
    router.push(`/exames/${id}/imprimir?${params.toString()}`);
  }

  function handleApplySADTFields() {
    const params = new URLSearchParams();
    params.set("formato", "sadt");
    if (operadora) params.set("operadora", operadora);
    if (carteirinha) params.set("carteirinha", carteirinha);
    if (registroANS) params.set("registro_ans", registroANS);
    router.push(`/exames/${id}/imprimir?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateToFormato("particular")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${
            !isSADT
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Particular
        </button>
        <button
          onClick={() => navigateToFormato("sadt")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${
            isSADT
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h-7.5c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-7.5m-1.125 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.125-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
          </svg>
          SADT
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
          </svg>
          Imprimir
        </button>
      </div>

      {/* SADT editable fields */}
      {isSADT && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="mb-3 text-xs font-semibold text-blue-800">
            Dados do convênio (preenchidos na hora de imprimir)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="sadt-operadora" className="block text-xs font-medium text-gray-700">
                Operadora
              </label>
              <input
                id="sadt-operadora"
                type="text"
                value={operadora}
                onChange={(e) => setOperadora(e.target.value)}
                placeholder="Nome da operadora"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="sadt-carteirinha" className="block text-xs font-medium text-gray-700">
                N° Carteirinha
              </label>
              <input
                id="sadt-carteirinha"
                type="text"
                value={carteirinha}
                onChange={(e) => setCarteirinha(e.target.value)}
                placeholder="Número da carteirinha"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="sadt-registro-ans" className="block text-xs font-medium text-gray-700">
                Registro ANS
              </label>
              <input
                id="sadt-registro-ans"
                type="text"
                value={registroANS}
                onChange={(e) => setRegistroANS(e.target.value)}
                placeholder="Registro ANS"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <button
            onClick={handleApplySADTFields}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Aplicar dados
          </button>
        </div>
      )}
    </div>
  );
}
