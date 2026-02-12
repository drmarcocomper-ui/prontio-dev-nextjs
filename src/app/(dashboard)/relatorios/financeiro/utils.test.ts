import { describe, it, expect } from "vitest";
import {
  getMonthDateRange,
  computeKPIs,
  getMonthLabel,
  aggregateByCategoria,
  aggregateByPagamento,
  REPORT_SELECT,
} from "./utils";
import type { TransacaoListItem } from "../../financeiro/constants";

const items: TransacaoListItem[] = [
  {
    id: "1",
    tipo: "receita",
    categoria: "consulta",
    descricao: "Consulta",
    valor: 300,
    data: "2024-06-10",
    forma_pagamento: "pix",
    status: "pago",
    pacientes: { nome: "Maria" },
  },
  {
    id: "2",
    tipo: "despesa",
    categoria: "material",
    descricao: "Material",
    valor: 100,
    data: "2024-06-11",
    forma_pagamento: "cartao_credito",
    status: "pago",
    pacientes: null,
  },
  {
    id: "3",
    tipo: "receita",
    categoria: "consulta",
    descricao: "Consulta cancelada",
    valor: 200,
    data: "2024-06-12",
    forma_pagamento: "dinheiro",
    status: "cancelado",
    pacientes: null,
  },
  {
    id: "4",
    tipo: "receita",
    categoria: null,
    descricao: "Sem categoria",
    valor: 150,
    data: "2024-06-13",
    forma_pagamento: null,
    status: "pendente",
    pacientes: null,
  },
];

describe("getMonthDateRange", () => {
  it("retorna range para mês fornecido", () => {
    const result = getMonthDateRange("2024-06");
    expect(result.currentMonth).toBe("2024-06");
    expect(result.year).toBe(2024);
    expect(result.month).toBe(6);
    expect(result.startDate).toBe("2024-06-01");
    expect(result.endDate).toBe("2024-06-30");
  });

  it("retorna range para mês atual quando não fornecido", () => {
    const result = getMonthDateRange();
    const now = new Date();
    expect(result.year).toBe(now.getFullYear());
    expect(result.month).toBe(now.getMonth() + 1);
  });

  it("lida com fevereiro em ano bissexto", () => {
    const result = getMonthDateRange("2024-02");
    expect(result.endDate).toBe("2024-02-29");
  });

  it("lida com dezembro", () => {
    const result = getMonthDateRange("2024-12");
    expect(result.startDate).toBe("2024-12-01");
    expect(result.endDate).toBe("2024-12-31");
  });
});

describe("computeKPIs", () => {
  it("calcula totais excluindo cancelados", () => {
    const kpis = computeKPIs(items);
    expect(kpis.totalReceitas).toBe(450); // 300 + 150 (cancelado excluído)
    expect(kpis.totalDespesas).toBe(100);
    expect(kpis.saldo).toBe(350);
  });

  it("retorna zeros para lista vazia", () => {
    const kpis = computeKPIs([]);
    expect(kpis.totalReceitas).toBe(0);
    expect(kpis.totalDespesas).toBe(0);
    expect(kpis.saldo).toBe(0);
  });
});

describe("getMonthLabel", () => {
  it("retorna label formatado em pt-BR", () => {
    const label = getMonthLabel(2024, 6);
    expect(label).toContain("2024");
  });
});

describe("aggregateByCategoria", () => {
  it("agrupa por categoria excluindo cancelados", () => {
    const breakdown = aggregateByCategoria(items);
    const consultaRow = breakdown.find((r) => r.categoria === "consulta");
    expect(consultaRow).toBeDefined();
    expect(consultaRow!.receitas).toBe(300); // cancelado excluído
    expect(consultaRow!.label).toBe("Consulta");
  });

  it("trata itens sem categoria como sem_categoria", () => {
    const breakdown = aggregateByCategoria(items);
    const semCat = breakdown.find((r) => r.categoria === "sem_categoria");
    expect(semCat).toBeDefined();
    expect(semCat!.label).toBe("Sem categoria");
    expect(semCat!.receitas).toBe(150);
  });

  it("ordena por volume total decrescente", () => {
    const breakdown = aggregateByCategoria(items);
    expect(breakdown.length).toBeGreaterThan(1);
    const totals = breakdown.map((r) => r.receitas + r.despesas);
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeLessThanOrEqual(totals[i - 1]);
    }
  });

  it("retorna array vazio para lista vazia", () => {
    expect(aggregateByCategoria([])).toEqual([]);
  });
});

describe("aggregateByPagamento", () => {
  it("agrupa por forma de pagamento excluindo cancelados", () => {
    const breakdown = aggregateByPagamento(items);
    const pixRow = breakdown.find((r) => r.forma === "pix");
    expect(pixRow).toBeDefined();
    expect(pixRow!.qtd).toBe(1);
    expect(pixRow!.total).toBe(300);
    expect(pixRow!.label).toBe("PIX");
  });

  it("trata itens sem forma de pagamento como nao_informado", () => {
    const breakdown = aggregateByPagamento(items);
    const naoInformado = breakdown.find((r) => r.forma === "nao_informado");
    expect(naoInformado).toBeDefined();
    expect(naoInformado!.label).toBe("Não informado");
  });

  it("ordena por total decrescente", () => {
    const breakdown = aggregateByPagamento(items);
    const totals = breakdown.map((r) => r.total);
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeLessThanOrEqual(totals[i - 1]);
    }
  });

  it("retorna array vazio para lista vazia", () => {
    expect(aggregateByPagamento([])).toEqual([]);
  });
});

describe("REPORT_SELECT", () => {
  it("não inclui paciente_id, observacoes ou created_at", () => {
    expect(REPORT_SELECT).not.toContain("paciente_id");
    expect(REPORT_SELECT).not.toContain("observacoes");
    expect(REPORT_SELECT).not.toContain("created_at");
  });

  it("inclui campos necessários", () => {
    expect(REPORT_SELECT).toContain("id");
    expect(REPORT_SELECT).toContain("tipo");
    expect(REPORT_SELECT).toContain("categoria");
    expect(REPORT_SELECT).toContain("descricao");
    expect(REPORT_SELECT).toContain("valor");
    expect(REPORT_SELECT).toContain("data");
    expect(REPORT_SELECT).toContain("forma_pagamento");
    expect(REPORT_SELECT).toContain("status");
    expect(REPORT_SELECT).toContain("pacientes(nome)");
  });
});
