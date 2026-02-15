import { describe, it, expect } from "vitest";
import { TEXTO_MAX_LENGTH, TIPO_LABELS } from "./types";

describe("prontuarios/types", () => {
  it("TEXTO_MAX_LENGTH é 5000", () => {
    expect(TEXTO_MAX_LENGTH).toBe(5000);
  });

  it("TIPO_LABELS tem 5 entradas", () => {
    expect(Object.keys(TIPO_LABELS)).toHaveLength(5);
  });

  it("TIPO_LABELS contém Consulta, Retorno, Exame", () => {
    expect(TIPO_LABELS.consulta).toBe("Consulta");
    expect(TIPO_LABELS.retorno).toBe("Retorno");
    expect(TIPO_LABELS.exame).toBe("Exame");
  });
});
