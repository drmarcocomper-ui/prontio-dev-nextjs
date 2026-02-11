import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Filters } from "./filters";
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
  pacientes: { nome: string } | null;
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
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tipo?: string }>;
}) {
  const { mes, tipo } = await searchParams;

  const now = new Date();
  const currentMonth = mes || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = currentMonth.split("-").map(Number);
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const supabase = await createClient();

  let query = supabase
    .from("transacoes")
    .select("id, tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, created_at, pacientes(nome)")
    .gte("data", startDate)
    .lte("data", endDate)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  const { data: transacoes } = await query;
  const items = (transacoes ?? []) as unknown as Transacao[];

  const totalReceitas = items
    .filter((t) => t.tipo === "receita" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesas = items
    .filter((t) => t.tipo === "despesa" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  const monthLabel = new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="mt-1 text-sm capitalize text-gray-500">{monthLabel}</p>
        </div>
        <Link
          href="/financeiro/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova transação
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Receitas</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(totalReceitas)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Despesas</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(totalDespesas)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Saldo</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              saldo >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Filters currentMonth={currentMonth} currentType={tipo ?? ""} />

      {/* Transactions Table */}
      {items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Data
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Descrição
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoria
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pagamento
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Valor
                </th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {formatDate(t.data)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/financeiro/${t.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-sky-600"
                    >
                      {t.descricao}
                    </Link>
                    {t.pacientes && (
                      <p className="text-xs text-gray-500">
                        {t.pacientes.nome}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {t.categoria ? (CATEGORIA_LABELS[t.categoria] ?? t.categoria) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {t.forma_pagamento ? (PAGAMENTO_LABELS[t.forma_pagamento] ?? t.forma_pagamento) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[t.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t.status === "pago" ? "Pago" : t.status === "pendente" ? "Pendente" : "Cancelado"}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-5 py-3.5 text-right text-sm font-semibold ${
                      t.tipo === "receita" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.tipo === "despesa" && "- "}
                    {formatCurrency(t.valor)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <DeleteButton transacaoId={t.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            Nenhuma transação neste período
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Registre uma receita ou despesa para começar.
          </p>
          <Link
            href="/financeiro/novo"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova transação
          </Link>
        </div>
      )}
    </div>
  );
}
