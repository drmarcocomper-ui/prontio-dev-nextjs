import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import { FinanceiroChart, AgendamentosSemanaChart } from "./dashboard-charts";

describe("FinanceiroChart", () => {
  it("retorna null quando data está vazia", () => {
    const { container } = render(<FinanceiroChart data={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renderiza título 'Receitas vs Despesas'", () => {
    render(<FinanceiroChart data={[{ mes: "Jan", receitas: 5000, despesas: 3000 }]} />);
    expect(screen.getByText("Receitas vs Despesas")).toBeDefined();
  });

  it("renderiza subtítulo 'Últimos 6 meses'", () => {
    render(<FinanceiroChart data={[{ mes: "Jan", receitas: 5000, despesas: 3000 }]} />);
    expect(screen.getByText("Últimos 6 meses")).toBeDefined();
  });

  it("renderiza o gráfico quando data tem itens", () => {
    render(<FinanceiroChart data={[{ mes: "Jan", receitas: 5000, despesas: 3000 }]} />);
    expect(screen.getByTestId("bar-chart")).toBeDefined();
  });
});

describe("AgendamentosSemanaChart", () => {
  it("retorna null quando data está vazia", () => {
    const { container } = render(<AgendamentosSemanaChart data={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renderiza título 'Agendamentos da semana'", () => {
    render(<AgendamentosSemanaChart data={[{ dia: "Seg", total: 10, atendidos: 8 }]} />);
    expect(screen.getByText("Agendamentos da semana")).toBeDefined();
  });

  it("renderiza subtítulo 'Últimos 7 dias'", () => {
    render(<AgendamentosSemanaChart data={[{ dia: "Seg", total: 10, atendidos: 8 }]} />);
    expect(screen.getByText("Últimos 7 dias")).toBeDefined();
  });

  it("renderiza o gráfico quando data tem itens", () => {
    render(<AgendamentosSemanaChart data={[{ dia: "Seg", total: 10, atendidos: 8 }]} />);
    expect(screen.getByTestId("bar-chart")).toBeDefined();
  });
});
