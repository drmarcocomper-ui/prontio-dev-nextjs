import { describe, it, expect } from "vitest";
import {
  NOME_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  SEXO_LABELS,
  ESTADO_CIVIL_LABELS,
  CONVENIO_LABELS,
  ESTADOS_UF,
  validarCPF,
  calcAge,
} from "./types";

describe("pacientes/types", () => {
  it("NOME_MAX_LENGTH é 255", () => {
    expect(NOME_MAX_LENGTH).toBe(255);
  });

  it("OBSERVACOES_MAX_LENGTH é 1000", () => {
    expect(OBSERVACOES_MAX_LENGTH).toBe(1000);
  });

  it("SEXO_LABELS tem 3 entradas", () => {
    expect(Object.keys(SEXO_LABELS)).toHaveLength(3);
  });

  it("ESTADO_CIVIL_LABELS tem 5 entradas", () => {
    expect(Object.keys(ESTADO_CIVIL_LABELS)).toHaveLength(5);
  });

  it("CONVENIO_LABELS tem 29 entradas", () => {
    expect(Object.keys(CONVENIO_LABELS)).toHaveLength(29);
  });

  it("ESTADOS_UF tem 27 estados", () => {
    expect(ESTADOS_UF).toHaveLength(27);
  });

  it("ESTADOS_UF inclui SP, RJ, MG", () => {
    expect(ESTADOS_UF).toContain("SP");
    expect(ESTADOS_UF).toContain("RJ");
    expect(ESTADOS_UF).toContain("MG");
  });

  it("validarCPF retorna true para CPF válido", () => {
    expect(validarCPF("52998224725")).toBe(true);
  });

  it("validarCPF retorna false para CPF inválido", () => {
    expect(validarCPF("00000000001")).toBe(false);
  });

  it("validarCPF retorna false para CPF com dígitos repetidos", () => {
    expect(validarCPF("11111111111")).toBe(false);
  });

  it("calcAge calcula idade corretamente", () => {
    const age = calcAge("1995-01-15");
    const today = new Date();
    let expected = today.getFullYear() - 1995;
    const m = today.getMonth(); // 0-indexed (Jan = 0)
    if (m < 0 || (m === 0 && today.getDate() < 15)) expected--;
    expect(age).toBe(expected);
  });
});
