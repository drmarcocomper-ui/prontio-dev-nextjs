"use client";

import { useState } from "react";

export function DadosForm() {
  const [downloading, setDownloading] = useState(false);

  async function handleBackup() {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Erro ao gerar backup.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "prontio-backup.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao baixar o backup. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Backup manual */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Backup dos dados</h3>
        <p className="mt-1 text-sm text-gray-600">
          Exporte todos os dados do sistema (pacientes, agendamentos, prontuários, transações e configurações) em formato JSON.
        </p>
        <button
          type="button"
          onClick={handleBackup}
          disabled={downloading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {downloading ? (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
          {downloading ? "Gerando backup..." : "Baixar backup"}
        </button>
      </div>

      {/* Info about automatic backups */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-amber-800">Backup automático</h4>
            <p className="mt-1 text-xs text-amber-700">
              Recomendamos fazer backup regularmente. Para backups automáticos diários,
              considere o plano Pro do Supabase que inclui backups automáticos com retenção de 7 dias.
            </p>
          </div>
        </div>
      </div>

      {/* Data info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Sobre seus dados</h3>
        <p className="mt-1 text-sm text-gray-600">
          Todos os dados são armazenados com criptografia no Supabase e protegidos por
          Row Level Security (RLS). Apenas usuários autenticados têm acesso.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Criptografia em trânsito (HTTPS/TLS)
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Criptografia em repouso (AES-256)
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Controle de acesso por linha (RLS)
          </li>
        </ul>
      </div>
    </div>
  );
}
