import { describe, it, expect } from "vitest";
import { maskCPF, maskPhone, maskCEP, maskCurrency, maskCNPJ } from "./masks";

describe("maskCPF", () => {
  it("formata CPF completo", () => {
    expect(maskCPF("12345678901")).toBe("123.456.789-01");
  });

  it("formata CPF parcial", () => {
    expect(maskCPF("1234")).toBe("123.4");
    expect(maskCPF("12345678")).toBe("123.456.78");
  });

  it("remove caracteres não numéricos", () => {
    expect(maskCPF("123.456.789-01")).toBe("123.456.789-01");
    expect(maskCPF("abc123def456")).toBe("123.456");
  });

  it("limita a 11 dígitos", () => {
    expect(maskCPF("123456789012345")).toBe("123.456.789-01");
  });

  it("retorna vazio para entrada vazia", () => {
    expect(maskCPF("")).toBe("");
  });
});

describe("maskPhone", () => {
  it("formata telefone com 10 dígitos (fixo)", () => {
    expect(maskPhone("1134567890")).toBe("(11) 3456-7890");
  });

  it("formata telefone com 11 dígitos (celular)", () => {
    expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formata telefone parcial", () => {
    expect(maskPhone("119")).toBe("(11) 9");
    expect(maskPhone("119876")).toBe("(11) 9876");
  });

  it("remove caracteres não numéricos", () => {
    expect(maskPhone("(11) 98765-4321")).toBe("(11) 98765-4321");
  });

  it("limita a 11 dígitos", () => {
    expect(maskPhone("119876543210000")).toBe("(11) 98765-4321");
  });
});

describe("maskCEP", () => {
  it("formata CEP completo", () => {
    expect(maskCEP("01310100")).toBe("01310-100");
  });

  it("formata CEP parcial", () => {
    expect(maskCEP("013")).toBe("013");
    expect(maskCEP("01310")).toBe("01310");
  });

  it("remove caracteres não numéricos", () => {
    expect(maskCEP("01310-100")).toBe("01310-100");
  });

  it("limita a 8 dígitos", () => {
    expect(maskCEP("013101001234")).toBe("01310-100");
  });
});

describe("maskCurrency", () => {
  it("formata valor inteiro", () => {
    expect(maskCurrency("10000")).toBe("100,00");
  });

  it("formata centavos", () => {
    expect(maskCurrency("1")).toBe("0,01");
    expect(maskCurrency("50")).toBe("0,50");
  });

  it("retorna vazio para entrada vazia", () => {
    expect(maskCurrency("")).toBe("");
  });

  it("formata valor zero", () => {
    expect(maskCurrency("0")).toBe("0,00");
  });

  it("formata valor grande com separador de milhar", () => {
    expect(maskCurrency("100000")).toBe("1.000,00");
  });

  it("remove caracteres não numéricos", () => {
    expect(maskCurrency("R$ 100,00")).toBe("100,00");
  });
});

describe("maskCNPJ", () => {
  it("formata CNPJ completo", () => {
    expect(maskCNPJ("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("formata CNPJ parcial", () => {
    expect(maskCNPJ("12345")).toBe("12.345");
    expect(maskCNPJ("12345678")).toBe("12.345.678");
  });

  it("limita a 14 dígitos", () => {
    expect(maskCNPJ("1234567800019900")).toBe("12.345.678/0001-99");
  });

  it("remove caracteres não numéricos", () => {
    expect(maskCNPJ("12.345.678/0001-99")).toBe("12.345.678/0001-99");
  });
});
