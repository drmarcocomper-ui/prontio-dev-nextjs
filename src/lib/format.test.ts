import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateLong,
  formatDateMedium,
  formatDateBR,
  formatTime,
  formatCurrency,
  formatRelativeTime,
  getInitials,
  formatCPF,
  formatPhone,
  formatCEP,
} from "./format";

describe("formatDate", () => {
  it("formata data YYYY-MM-DD para DD/MM/YYYY", () => {
    expect(formatDate("2024-03-15")).toBe("15/03/2024");
  });

  it("formata data com mês e dia de um dígito", () => {
    expect(formatDate("2024-01-05")).toBe("05/01/2024");
  });
});

describe("formatDateLong", () => {
  it("formata data no formato longo com dia da semana", () => {
    const result = formatDateLong("2024-03-15");
    expect(result).toContain("15");
    expect(result).toContain("março");
    expect(result).toContain("2024");
  });
});

describe("formatDateMedium", () => {
  it("formata data no formato médio", () => {
    const result = formatDateMedium("2024-03-15");
    expect(result).toContain("15");
    expect(result).toContain("março");
    expect(result).toContain("2024");
  });
});

describe("formatDateBR", () => {
  it("formata data com locale pt-BR e dia da semana", () => {
    const result = formatDateBR("2024-03-15");
    expect(result).toContain("15");
    expect(result).toContain("março");
    expect(result).toContain("2024");
  });
});

describe("formatTime", () => {
  it("extrai HH:MM de HH:MM:SS", () => {
    expect(formatTime("14:30:00")).toBe("14:30");
  });

  it("mantém HH:MM quando já nesse formato", () => {
    expect(formatTime("08:00")).toBe("08:00");
  });
});

describe("formatCurrency", () => {
  it("formata valor positivo como moeda BRL", () => {
    const result = formatCurrency(1500.5);
    expect(result).toContain("1.500,50");
    expect(result).toContain("R$");
  });

  it("formata valor zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0,00");
  });

  it("formata valor negativo", () => {
    const result = formatCurrency(-250);
    expect(result).toContain("250,00");
  });
});

describe("formatRelativeTime", () => {
  it("retorna 'agora' para diferença menor que 1 minuto", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("agora");
  });

  it("retorna minutos para diferença menor que 1 hora", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe("há 5 min");
  });

  it("retorna horas para diferença menor que 24 horas", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe("há 3h");
  });

  it("retorna 'ontem' para diferença de 1 dia", () => {
    const date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe("ontem");
  });

  it("retorna dias para diferença menor que 7 dias", () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe("há 3 dias");
  });

  it("retorna data formatada para 7 dias ou mais", () => {
    const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(date);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe("getInitials", () => {
  it("retorna iniciais de nome completo", () => {
    expect(getInitials("João Silva")).toBe("JS");
  });

  it("retorna inicial de nome simples", () => {
    expect(getInitials("Maria")).toBe("M");
  });

  it("retorna no máximo 2 iniciais para nomes longos", () => {
    expect(getInitials("Ana Maria Santos Silva")).toBe("AM");
  });

  it("retorna iniciais em maiúsculo", () => {
    expect(getInitials("pedro santos")).toBe("PS");
  });
});

describe("formatCPF", () => {
  it("formata CPF com pontos e traço", () => {
    expect(formatCPF("12345678901")).toBe("123.456.789-01");
  });
});

describe("formatPhone", () => {
  it("formata telefone celular com 11 dígitos", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formata telefone fixo com 10 dígitos", () => {
    expect(formatPhone("1134567890")).toBe("(11) 3456-7890");
  });

  it("retorna valor original para formato desconhecido", () => {
    expect(formatPhone("123")).toBe("123");
  });
});

describe("formatCEP", () => {
  it("formata CEP com traço", () => {
    expect(formatCEP("01310100")).toBe("01310-100");
  });
});
