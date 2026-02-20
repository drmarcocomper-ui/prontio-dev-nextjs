import { describe, it, expect } from "vitest";
import {
  PAPEL_BADGE,
  PAPEL_OPTIONS,
  PAPEIS_VALIDOS,
  EMAIL_MAX,
  SENHA_MIN,
  SENHA_MAX,
} from "./types";

describe("usuarios/types", () => {
  it("PAPEL_BADGE tem 5 entradas", () => {
    expect(Object.keys(PAPEL_BADGE)).toHaveLength(5);
  });

  it("cada PAPEL_BADGE tem label e className", () => {
    for (const [, badge] of Object.entries(PAPEL_BADGE)) {
      expect(badge).toHaveProperty("label");
      expect(badge).toHaveProperty("className");
      expect(typeof badge.label).toBe("string");
      expect(typeof badge.className).toBe("string");
    }
  });

  it("PAPEL_OPTIONS tem 4 opções", () => {
    expect(PAPEL_OPTIONS).toHaveLength(4);
  });

  it("PAPEIS_VALIDOS tem 4 papéis", () => {
    expect(PAPEIS_VALIDOS).toHaveLength(4);
  });

  it("EMAIL_MAX é 254", () => {
    expect(EMAIL_MAX).toBe(254);
  });

  it("SENHA_MIN é 8", () => {
    expect(SENHA_MIN).toBe(8);
  });

  it("SENHA_MAX é 128", () => {
    expect(SENHA_MAX).toBe(128);
  });
});
