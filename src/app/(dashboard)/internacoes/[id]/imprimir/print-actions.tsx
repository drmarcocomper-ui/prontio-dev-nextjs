"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PrintActions({
  id,
  defaultRegistroANS,
  defaultCarteirinha,
  defaultValidadeCarteirinha,
  defaultCodigoOperadora,
  defaultNomeContratado,
  defaultUf,
  defaultCbo,
  defaultHospitalCodigo,
  defaultAtendimentoRN,
}: {
  id: string;
  defaultRegistroANS: string;
  defaultCarteirinha: string;
  defaultValidadeCarteirinha: string;
  defaultCodigoOperadora: string;
  defaultNomeContratado: string;
  defaultUf: string;
  defaultCbo: string;
  defaultHospitalCodigo: string;
  defaultAtendimentoRN: string;
}) {
  const router = useRouter();

  const [registroANS, setRegistroANS] = useState(defaultRegistroANS);
  const [carteirinha, setCarteirinha] = useState(defaultCarteirinha);
  const [validadeCarteirinha, setValidadeCarteirinha] = useState(defaultValidadeCarteirinha);
  const [codigoOperadora, setCodigoOperadora] = useState(defaultCodigoOperadora);
  const [nomeContratado, setNomeContratado] = useState(defaultNomeContratado);
  const [uf, setUf] = useState(defaultUf);
  const [cbo, setCbo] = useState(defaultCbo);
  const [hospitalCodigo, setHospitalCodigo] = useState(defaultHospitalCodigo);
  const [atendimentoRN, setAtendimentoRN] = useState(defaultAtendimentoRN);

  function handleApply() {
    const params = new URLSearchParams();
    if (registroANS) params.set("registro_ans", registroANS);
    if (carteirinha) params.set("carteirinha", carteirinha);
    if (validadeCarteirinha) params.set("validade_carteirinha", validadeCarteirinha);
    if (codigoOperadora) params.set("codigo_operadora", codigoOperadora);
    if (nomeContratado) params.set("nome_contratado", nomeContratado);
    if (uf) params.set("uf", uf);
    if (cbo) params.set("cbo", cbo);
    if (hospitalCodigo) params.set("hospital_codigo", hospitalCodigo);
    if (atendimentoRN && atendimentoRN !== "N") params.set("atendimento_rn", atendimentoRN);
    const qs = params.toString();
    router.push(`/internacoes/${id}/imprimir${qs ? `?${qs}` : ""}`);
  }

  const inputClass = "mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
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

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="mb-3 text-xs font-semibold text-blue-800">
          Dados do convênio (preenchidos na hora de imprimir)
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="tiss-registro-ans" className="block text-xs font-medium text-gray-700">
              Registro ANS
            </label>
            <input
              id="tiss-registro-ans"
              type="text"
              value={registroANS}
              onChange={(e) => setRegistroANS(e.target.value)}
              placeholder="Registro ANS"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tiss-carteirinha" className="block text-xs font-medium text-gray-700">
              N° Carteirinha
            </label>
            <input
              id="tiss-carteirinha"
              type="text"
              value={carteirinha}
              onChange={(e) => setCarteirinha(e.target.value)}
              placeholder="Número da carteirinha"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tiss-validade" className="block text-xs font-medium text-gray-700">
              Validade Carteirinha
            </label>
            <input
              id="tiss-validade"
              type="text"
              value={validadeCarteirinha}
              onChange={(e) => setValidadeCarteirinha(e.target.value)}
              placeholder="DD/MM/AAAA"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tiss-cod-operadora" className="block text-xs font-medium text-gray-700">
              Cód. Operadora Solicitante
            </label>
            <input
              id="tiss-cod-operadora"
              type="text"
              value={codigoOperadora}
              onChange={(e) => setCodigoOperadora(e.target.value)}
              placeholder="Código"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tiss-nome-contratado" className="block text-xs font-medium text-gray-700">
              Nome Contratado
            </label>
            <input
              id="tiss-nome-contratado"
              type="text"
              value={nomeContratado}
              onChange={(e) => setNomeContratado(e.target.value)}
              placeholder="Nome do contratado"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tiss-uf" className="block text-xs font-medium text-gray-700">
              UF
            </label>
            <input
              id="tiss-uf"
              type="text"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              placeholder="UF"
              maxLength={2}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tiss-cbo" className="block text-xs font-medium text-gray-700">
              Código CBO
            </label>
            <input
              id="tiss-cbo"
              type="text"
              value={cbo}
              onChange={(e) => setCbo(e.target.value)}
              placeholder="CBO"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tiss-hospital-cod" className="block text-xs font-medium text-gray-700">
              Cód. Operadora Hospital
            </label>
            <input
              id="tiss-hospital-cod"
              type="text"
              value={hospitalCodigo}
              onChange={(e) => setHospitalCodigo(e.target.value)}
              placeholder="Código"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tiss-rn" className="block text-xs font-medium text-gray-700">
              Atendimento RN
            </label>
            <select
              id="tiss-rn"
              value={atendimentoRN}
              onChange={(e) => setAtendimentoRN(e.target.value)}
              className={inputClass}
            >
              <option value="N">N - Não</option>
              <option value="S">S - Sim</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleApply}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Aplicar dados
        </button>
      </div>
    </div>
  );
}
