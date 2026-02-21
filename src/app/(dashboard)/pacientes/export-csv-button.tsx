"use client";

import { SEXO_LABELS, ESTADO_CIVIL_LABELS, CONVENIO_LABELS, formatCPF, formatPhone, formatCEP, formatDate } from "./types";
import type { ConvenioTipo } from "./types";

export interface PacienteCSV {
  nome: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  estado_civil: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  convenio: string | null;
}

function formatEndereco(p: PacienteCSV): string {
  const parts: string[] = [];
  if (p.endereco) {
    let addr = p.endereco;
    if (p.numero) addr += `, ${p.numero}`;
    if (p.complemento) addr += ` - ${p.complemento}`;
    parts.push(addr);
  }
  if (p.bairro) parts.push(p.bairro);
  return parts.join(", ");
}

export function ExportCsvButton({ data }: { data: PacienteCSV[] }) {
  function handleExport() {
    const headers = [
      "Nome",
      "CPF",
      "RG",
      "Data de Nascimento",
      "Sexo",
      "Estado Civil",
      "Telefone",
      "E-mail",
      "Endereço",
      "Cidade",
      "Estado",
      "CEP",
      "Convênio",
    ];

    const rows = data.map((p) =>
      [
        p.nome,
        p.cpf ? formatCPF(p.cpf) : "",
        p.rg ?? "",
        p.data_nascimento ? formatDate(p.data_nascimento) : "",
        p.sexo ? (SEXO_LABELS[p.sexo] ?? p.sexo) : "",
        p.estado_civil ? (ESTADO_CIVIL_LABELS[p.estado_civil] ?? p.estado_civil) : "",
        p.telefone ? formatPhone(p.telefone) : "",
        p.email ?? "",
        formatEndereco(p),
        p.cidade ?? "",
        p.estado ?? "",
        p.cep ? formatCEP(p.cep) : "",
        p.convenio ? (CONVENIO_LABELS[p.convenio as ConvenioTipo] ?? p.convenio) : "",
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(";")
    );

    const csv = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `pacientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Exportar CSV
    </button>
  );
}
