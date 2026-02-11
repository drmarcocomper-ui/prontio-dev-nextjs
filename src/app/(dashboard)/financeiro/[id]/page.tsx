import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "./delete-button";

interface Transacao {
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
  created_at: string;
  pacientes: { id: string; nome: string } | null;
}

const CATEGORIA_LABELS: Record<string, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  procedimento: "Procedimento",
  aluguel: "Aluguel",
  salario: "Salário",
  material: "Material",
  equipamento: "Equipamento",
  imposto: "Imposto",
  outros: "Outros",
};

const PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  boleto: "Boleto",
  transferencia: "Transferência",
  convenio: "Convênio",
};

const STATUS_STYLES: Record<string, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default async function TransacaoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: transacao } = await supabase
    .from("transacoes")
    .select(
      "id, tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, created_at, pacientes(id, nome)"
    )
    .eq("id", id)
    .single();

  if (!transacao) {
    notFound();
  }

  const t = transacao as unknown as Transacao;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/financeiro"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Financeiro
      </Link>

      {/* Header Card */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                t.tipo === "receita"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {t.tipo === "receita" ? "Receita" : "Despesa"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[t.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {t.status === "pago" ? "Pago" : t.status === "pendente" ? "Pendente" : "Cancelado"}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold text-gray-900">{t.descricao}</h1>
          <p className="mt-1 text-sm capitalize text-gray-500">{formatDate(t.data)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/financeiro/${t.id}/editar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <DeleteButton transacaoId={t.id} />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Detalhes da transação
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Valor
            </h3>
            <p
              className={`mt-1 text-lg font-bold ${
                t.tipo === "receita" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {t.tipo === "despesa" && "- "}
              {formatCurrency(t.valor)}
            </p>
          </div>

          {t.categoria && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Categoria
              </h3>
              <p className="mt-1 text-sm text-gray-800">
                {CATEGORIA_LABELS[t.categoria] ?? t.categoria}
              </p>
            </div>
          )}

          {t.forma_pagamento && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Forma de pagamento
              </h3>
              <p className="mt-1 text-sm text-gray-800">
                {PAGAMENTO_LABELS[t.forma_pagamento] ?? t.forma_pagamento}
              </p>
            </div>
          )}

          {t.pacientes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Paciente
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  {getInitials(t.pacientes.nome)}
                </div>
                <Link
                  href={`/pacientes/${t.pacientes.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-sky-600"
                >
                  {t.pacientes.nome}
                </Link>
              </div>
            </div>
          )}
        </div>

        {t.observacoes && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Observações
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {t.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="text-xs text-gray-400">
        Registro criado em{" "}
        {new Date(t.created_at).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
