"use client";

export interface TransacaoCSV {
  data: string;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: string;
  forma_pagamento: string;
  status: string;
  paciente: string;
}

export function ExportCsvButton({
  data,
  month,
}: {
  data: TransacaoCSV[];
  month: string;
}) {
  function handleExport() {
    const headers = [
      "Data",
      "Tipo",
      "Categoria",
      "Descrição",
      "Valor",
      "Forma de pagamento",
      "Status",
      "Paciente",
    ];

    const rows = data.map((t) =>
      [
        t.data,
        t.tipo,
        t.categoria,
        t.descricao,
        t.valor,
        t.forma_pagamento,
        t.status,
        t.paciente,
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(";")
    );

    const csv = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-financeiro-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Exportar CSV
    </button>
  );
}
