import { describe, it, expect } from "vitest";
import { escapeLikePattern } from "./sanitize";

describe("escapeLikePattern", () => {
  it("retorna string inalterada quando não há caracteres especiais", () => {
    expect(escapeLikePattern("João Silva")).toBe("João Silva");
  });

  it("escapa caractere %", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
  });

  it("escapa caractere _", () => {
    expect(escapeLikePattern("nome_teste")).toBe("nome\\_teste");
  });

  it("escapa caractere \\", () => {
    expect(escapeLikePattern("path\\file")).toBe("path\\\\file");
  });

  it("escapa múltiplos caracteres especiais", () => {
    expect(escapeLikePattern("%_\\")).toBe("\\%\\_\\\\");
  });

  it("retorna string vazia para input vazio", () => {
    expect(escapeLikePattern("")).toBe("");
  });

  it("não escapa parênteses, vírgulas ou pontos", () => {
    expect(escapeLikePattern("a(b),c.d")).toBe("a(b),c.d");
  });

  it("preserva caracteres unicode", () => {
    expect(escapeLikePattern("José María")).toBe("José María");
  });
});
