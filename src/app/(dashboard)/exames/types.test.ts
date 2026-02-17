import { describe, it, expect } from "vitest";
import {
  EXAMES_MAX_LENGTH,
  INDICACAO_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  parseExames,
} from "./types";

describe("exames/types", () => {
  it("EXAMES_MAX_LENGTH é 5000", () => {
    expect(EXAMES_MAX_LENGTH).toBe(5000);
  });

  it("INDICACAO_MAX_LENGTH é 2000", () => {
    expect(INDICACAO_MAX_LENGTH).toBe(2000);
  });

  it("OBSERVACOES_MAX_LENGTH é 1000", () => {
    expect(OBSERVACOES_MAX_LENGTH).toBe(1000);
  });

  describe("parseExames", () => {
    it("retorna items vazio e freeText vazio para string vazia", () => {
      const result = parseExames("");
      expect(result.items).toHaveLength(0);
      expect(result.freeText).toHaveLength(0);
    });

    it("extrai exame com código TUSS", () => {
      const result = parseExames("- Hemograma Completo (TUSS: 40304361)");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].nome).toBe("Hemograma Completo");
      expect(result.items[0].codigoTuss).toBe("40304361");
    });

    it("extrai exame sem código TUSS", () => {
      const result = parseExames("- Glicemia de Jejum");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].nome).toBe("Glicemia de Jejum");
      expect(result.items[0].codigoTuss).toBeNull();
    });

    it("trata linhas sem prefixo como freeText", () => {
      const result = parseExames("Exame de rotina solicitado");
      expect(result.items).toHaveLength(0);
      expect(result.freeText).toHaveLength(1);
      expect(result.freeText[0]).toBe("Exame de rotina solicitado");
    });

    it("ignora linhas vazias", () => {
      const result = parseExames("\n\n- Hemograma\n\n");
      expect(result.items).toHaveLength(1);
      expect(result.freeText).toHaveLength(0);
    });

    it("extrai múltiplos exames", () => {
      const text = [
        "- Hemograma Completo (TUSS: 40304361)",
        "- Glicemia de Jejum",
        "- TSH (TUSS: 40316521)",
      ].join("\n");
      const result = parseExames(text);
      expect(result.items).toHaveLength(3);
      expect(result.items[0].codigoTuss).toBe("40304361");
      expect(result.items[1].codigoTuss).toBeNull();
      expect(result.items[2].codigoTuss).toBe("40316521");
    });

    it("separa items e freeText corretamente em texto misto", () => {
      const text = [
        "Solicito os seguintes exames:",
        "- Hemograma (TUSS: 40304361)",
        "- Ureia",
        "Observação adicional",
      ].join("\n");
      const result = parseExames(text);
      expect(result.items).toHaveLength(2);
      expect(result.freeText).toHaveLength(2);
      expect(result.freeText[0]).toBe("Solicito os seguintes exames:");
      expect(result.freeText[1]).toBe("Observação adicional");
    });
  });
});
