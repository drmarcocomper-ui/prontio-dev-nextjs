import { describe, it, expect } from "vitest";
import {
  STATUS_LABELS,
  TIPO_LABELS,
  STATUS_STYLES,
  STATUS_TRANSITIONS,
  OBSERVACOES_MAX_LENGTH,
} from "./types";

describe("agenda/types", () => {
  it("STATUS_LABELS tem 6 entradas", () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(6);
  });

  it("TIPO_LABELS tem 2 entradas", () => {
    expect(Object.keys(TIPO_LABELS)).toHaveLength(2);
  });

  it("STATUS_STYLES tem estilo para cada status", () => {
    const keys = Object.keys(STATUS_LABELS);
    for (const key of keys) {
      const style = STATUS_STYLES[key as keyof typeof STATUS_STYLES];
      expect(style).toBeDefined();
      expect(style).toMatch(/^bg-/);
    }
  });

  it("STATUS_TRANSITIONS define transições para cada status", () => {
    const keys = Object.keys(STATUS_LABELS);
    for (const key of keys) {
      const transitions = STATUS_TRANSITIONS[key as keyof typeof STATUS_TRANSITIONS];
      expect(transitions).toBeDefined();
      expect(Array.isArray(transitions)).toBe(true);
    }
  });

  it("atendido não tem transições (empty array)", () => {
    expect(STATUS_TRANSITIONS.atendido).toEqual([]);
  });

  it("cancelado pode voltar para agendado", () => {
    expect(STATUS_TRANSITIONS.cancelado).toContain("agendado");
  });

  it("OBSERVACOES_MAX_LENGTH é 1000", () => {
    expect(OBSERVACOES_MAX_LENGTH).toBe(1000);
  });
});
