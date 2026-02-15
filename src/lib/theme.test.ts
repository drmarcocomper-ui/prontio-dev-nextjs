import { describe, it, expect } from "vitest";
import { THEME_OPTIONS, DEFAULT_THEME, VALID_THEMES, type ThemeName } from "./theme";

describe("theme", () => {
  it("DEFAULT_THEME é sky", () => {
    expect(DEFAULT_THEME).toBe("sky");
  });

  it("THEME_OPTIONS contém 6 temas", () => {
    expect(THEME_OPTIONS).toHaveLength(6);
  });

  it("cada tema tem key, label e swatch", () => {
    for (const option of THEME_OPTIONS) {
      expect(option.key).toBeTruthy();
      expect(option.label).toBeTruthy();
      expect(option.swatch).toMatch(/^bg-/);
    }
  });

  it("VALID_THEMES contém todos os temas de THEME_OPTIONS", () => {
    for (const option of THEME_OPTIONS) {
      expect(VALID_THEMES.has(option.key)).toBe(true);
    }
  });

  it("VALID_THEMES não contém temas inválidos", () => {
    expect(VALID_THEMES.has("invalid")).toBe(false);
    expect(VALID_THEMES.has("")).toBe(false);
  });

  it("VALID_THEMES tem o mesmo tamanho que THEME_OPTIONS", () => {
    expect(VALID_THEMES.size).toBe(THEME_OPTIONS.length);
  });

  it.each(["sky", "blue", "violet", "emerald", "rose", "amber"] as ThemeName[])(
    "tema %s está presente em VALID_THEMES",
    (theme) => {
      expect(VALID_THEMES.has(theme)).toBe(true);
    }
  );

  it("THEME_OPTIONS inclui labels em português", () => {
    const labels = THEME_OPTIONS.map((t) => t.label);
    expect(labels).toContain("Azul");
    expect(labels).toContain("Violeta");
    expect(labels).toContain("Esmeralda");
    expect(labels).toContain("Rosa");
    expect(labels).toContain("Âmbar");
  });
});
