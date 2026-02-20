"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface FinanceiroItem {
  mes: string;
  receitas: number;
  despesas: number;
}

interface AgendamentosSemanaItem {
  dia: string;
  total: number;
  atendidos: number;
}

function currencyFormatter(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function FinanceiroChart({ data }: { data: FinanceiroItem[] }) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="font-semibold text-gray-900">Receitas vs Despesas</h2>
        <p className="mt-0.5 text-xs text-gray-500">Últimos 6 meses</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={data} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={currencyFormatter}
                width={80}
              />
              <Tooltip
                formatter={(value) => currencyFormatter(Number(value))}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }}
              />
              <Bar
                dataKey="receitas"
                name="Receitas"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="despesas"
                name="Despesas"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function AgendamentosSemanaChart({
  data,
}: {
  data: AgendamentosSemanaItem[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="font-semibold text-gray-900">Agendamentos da semana</h2>
        <p className="mt-0.5 text-xs text-gray-500">Últimos 7 dias</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={data} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }}
              />
              <Bar
                dataKey="total"
                name="Agendados"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="atendidos"
                name="Atendidos"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
