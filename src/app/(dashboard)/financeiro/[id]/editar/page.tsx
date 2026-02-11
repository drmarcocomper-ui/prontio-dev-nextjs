import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransacaoForm } from "../../novo/transacao-form";

interface TransacaoComPaciente {
  id: string;
  tipo: string;
  categoria: string | null;
  descricao: string;
  valor: number;
  data: string;
  paciente_id: string | null;
  forma_pagamento: string | null;
  status: string;
  observacoes: string | null;
  pacientes: { id: string; nome: string } | null;
}

function maskCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function EditarTransacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: transacao } = await supabase
    .from("transacoes")
    .select(
      "id, tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!transacao) {
    notFound();
  }

  const t = transacao as unknown as TransacaoComPaciente;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/financeiro/${t.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar para transação
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar transação
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <TransacaoForm
          defaults={{
            id: t.id,
            tipo: t.tipo,
            categoria: t.categoria,
            descricao: t.descricao,
            valor: maskCurrency(String(Math.round(t.valor * 100))),
            data: t.data,
            paciente_id: t.pacientes?.id ?? null,
            paciente_nome: t.pacientes?.nome ?? null,
            forma_pagamento: t.forma_pagamento,
            status: t.status,
            observacoes: t.observacoes,
          }}
        />
      </div>
    </div>
  );
}
