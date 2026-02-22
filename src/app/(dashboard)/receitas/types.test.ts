import { describe, it, expect } from "vitest";
import {
  MEDICAMENTOS_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  TIPO_LABELS,
  TIPO_LABELS_IMPRESSAO,
} from "./types";

describe("receitas/types", () => {
  it("MEDICAMENTOS_MAX_LENGTH é 5000", () => {
    expect(MEDICAMENTOS_MAX_LENGTH).toBe(5000);
  });

  it("OBSERVACOES_MAX_LENGTH é 1000", () => {
    expect(OBSERVACOES_MAX_LENGTH).toBe(1000);
  });

  it("TIPO_LABELS tem 2 entradas", () => {
    expect(Object.keys(TIPO_LABELS)).toHaveLength(2);
  });

  it("TIPO_LABELS_IMPRESSAO tem 2 entradas", () => {
    expect(Object.keys(TIPO_LABELS_IMPRESSAO)).toHaveLength(2);
  });

  it("TIPO_LABELS_IMPRESSAO valores começam com 'Receita'", () => {
    for (const value of Object.values(TIPO_LABELS_IMPRESSAO)) {
      expect(value).toMatch(/^Receita/);
    }
  });
});
