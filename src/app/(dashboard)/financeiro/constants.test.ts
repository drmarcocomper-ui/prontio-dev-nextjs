import { describe, it, expect } from "vitest";
import {
  CATEGORIA_LABELS,
  PAGAMENTO_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
  DESCRICAO_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  formatCurrency,
  formatDate,
  formatDateLong,
  getInitials,
  maskCurrency,
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

  describe("STATUS_LABELS", () => {
    it("contém todos os status esperados", () => {
      expect(STATUS_LABELS.pago).toBe("Pago");
      expect(STATUS_LABELS.pendente).toBe("Pendente");
      expect(STATUS_LABELS.cancelado).toBe("Cancelado");
    });
  });

  describe("CATEGORIAS_RECEITA / CATEGORIAS_DESPESA", () => {
    it("categorias de receita contêm consulta e procedimento", () => {
      const values = CATEGORIAS_RECEITA.map((c) => c.value);
      expect(values).toContain("consulta");
      expect(values).toContain("procedimento");
    });

    it("categorias de despesa contêm aluguel e salario", () => {
      const values = CATEGORIAS_DESPESA.map((c) => c.value);
      expect(values).toContain("aluguel");
      expect(values).toContain("salario");
    });
  });

  describe("constantes de tamanho", () => {
    it("DESCRICAO_MAX_LENGTH é 255", () => {
      expect(DESCRICAO_MAX_LENGTH).toBe(255);
    });

    it("OBSERVACOES_MAX_LENGTH é 1000", () => {
      expect(OBSERVACOES_MAX_LENGTH).toBe(1000);
    });
  });

  describe("formatDateLong", () => {
    it("formata data no formato longo em pt-BR", () => {
      const result = formatDateLong("2024-06-15");
      expect(result).toContain("15");
      expect(result).toContain("junho");
      expect(result).toContain("2024");
    });
  });

  describe("getInitials", () => {
    it("retorna iniciais de nome com dois termos", () => {
      expect(getInitials("Maria Silva")).toBe("MS");
    });

    it("retorna uma inicial para nome com um termo", () => {
      expect(getInitials("João")).toBe("J");
    });

    it("retorna no máximo duas iniciais", () => {
      expect(getInitials("Ana Maria Costa")).toBe("AM");
    });
  });

  describe("maskCurrency", () => {
    it("formata dígitos como valor monetário", () => {
      expect(maskCurrency("35000")).toBe("350,00");
    });

    it("retorna vazio para entrada sem dígitos", () => {
      expect(maskCurrency("abc")).toBe("");
    });

    it("formata centavos corretamente", () => {
      expect(maskCurrency("99")).toBe("0,99");
    });
  });
});
