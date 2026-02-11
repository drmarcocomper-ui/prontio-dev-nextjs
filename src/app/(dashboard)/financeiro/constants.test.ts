import { describe, it, expect } from "vitest";
import {
  CATEGORIA_LABELS,
  PAGAMENTO_LABELS,
  STATUS_STYLES,
  formatCurrency,
  formatDate,
} from "./constants";

describe("constants", () => {
  describe("CATEGORIA_LABELS", () => {
    it("contém todas as categorias esperadas", () => {
      expect(CATEGORIA_LABELS.consulta).toBe("Consulta");
      expect(CATEGORIA_LABELS.retorno).toBe("Retorno");
      expect(CATEGORIA_LABELS.salario).toBe("Salário");
      expect(CATEGORIA_LABELS.outros).toBe("Outros");
    });
  });

  describe("PAGAMENTO_LABELS", () => {
    it("contém todas as formas de pagamento esperadas", () => {
      expect(PAGAMENTO_LABELS.dinheiro).toBe("Dinheiro");
      expect(PAGAMENTO_LABELS.pix).toBe("PIX");
      expect(PAGAMENTO_LABELS.cartao_credito).toBe("Cartão de crédito");
      expect(PAGAMENTO_LABELS.convenio).toBe("Convênio");
    });
  });

  describe("STATUS_STYLES", () => {
    it("retorna estilos corretos para cada status", () => {
      expect(STATUS_STYLES.pago).toContain("emerald");
      expect(STATUS_STYLES.pendente).toContain("amber");
      expect(STATUS_STYLES.cancelado).toContain("red");
    });
  });

  describe("formatCurrency", () => {
    it("formata valor positivo em reais", () => {
      const result = formatCurrency(1500);
      expect(result).toContain("R$");
      expect(result).toContain("1.500,00");
    });

    it("formata valor zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("R$");
      expect(result).toContain("0,00");
    });

    it("formata valor com centavos", () => {
      const result = formatCurrency(49.9);
      expect(result).toContain("R$");
      expect(result).toContain("49,90");
    });

    it("formata valor negativo", () => {
      const result = formatCurrency(-250);
      expect(result).toContain("R$");
      expect(result).toContain("250,00");
    });
  });

  describe("formatDate", () => {
    it("formata data no padrão pt-BR", () => {
      const result = formatDate("2024-06-15");
      expect(result).toBe("15/06/2024");
    });

    it("formata data de janeiro corretamente", () => {
      const result = formatDate("2024-01-01");
      expect(result).toBe("01/01/2024");
    });
  });
});
