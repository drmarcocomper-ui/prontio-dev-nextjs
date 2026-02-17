import { describe, it, expect } from "vitest";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, emailValido, valorPermitido, uuidValido } from "./validators";

describe("campoObrigatorio", () => {
  it("adiciona erro quando valor é vazio", () => {
    const errors: Record<string, string> = {};
    const result = campoObrigatorio(errors, "nome", "");
    expect(result).toBe(false);
    expect(errors.nome).toBe("Campo obrigatório.");
  });

  it("adiciona erro quando valor é null", () => {
    const errors: Record<string, string> = {};
    const result = campoObrigatorio(errors, "nome", null);
    expect(result).toBe(false);
    expect(errors.nome).toBe("Campo obrigatório.");
  });

  it("adiciona erro quando valor é undefined", () => {
    const errors: Record<string, string> = {};
    const result = campoObrigatorio(errors, "nome", undefined);
    expect(result).toBe(false);
    expect(errors.nome).toBe("Campo obrigatório.");
  });

  it("adiciona erro quando valor contém apenas espaços", () => {
    const errors: Record<string, string> = {};
    const result = campoObrigatorio(errors, "nome", "   ");
    expect(result).toBe(false);
    expect(errors.nome).toBe("Campo obrigatório.");
  });

  it("retorna true quando valor é válido", () => {
    const errors: Record<string, string> = {};
    const result = campoObrigatorio(errors, "nome", "João");
    expect(result).toBe(true);
    expect(errors).not.toHaveProperty("nome");
  });

  it("usa mensagem customizada quando fornecida", () => {
    const errors: Record<string, string> = {};
    campoObrigatorio(errors, "paciente_id", "", "Selecione um paciente.");
    expect(errors.paciente_id).toBe("Selecione um paciente.");
  });
});

describe("tamanhoMaximo", () => {
  it("não adiciona erro quando valor está dentro do limite", () => {
    const errors: Record<string, string> = {};
    tamanhoMaximo(errors, "nome", "abc", 10);
    expect(errors).not.toHaveProperty("nome");
  });

  it("não adiciona erro quando valor está no limite exato", () => {
    const errors: Record<string, string> = {};
    tamanhoMaximo(errors, "nome", "abcde", 5);
    expect(errors).not.toHaveProperty("nome");
  });

  it("adiciona erro quando valor excede o limite", () => {
    const errors: Record<string, string> = {};
    tamanhoMaximo(errors, "nome", "abcdef", 5);
    expect(errors.nome).toBe("Máximo de 5 caracteres.");
  });

  it("não adiciona erro quando valor é null", () => {
    const errors: Record<string, string> = {};
    tamanhoMaximo(errors, "nome", null, 10);
    expect(errors).not.toHaveProperty("nome");
  });

  it("não adiciona erro quando valor é undefined", () => {
    const errors: Record<string, string> = {};
    tamanhoMaximo(errors, "nome", undefined, 10);
    expect(errors).not.toHaveProperty("nome");
  });
});

describe("dataNaoFutura", () => {
  it("não adiciona erro para data no passado", () => {
    const errors: Record<string, string> = {};
    dataNaoFutura(errors, "data", "2020-01-01");
    expect(errors).not.toHaveProperty("data");
  });

  it("não adiciona erro para data de hoje", () => {
    const errors: Record<string, string> = {};
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    dataNaoFutura(errors, "data", today);
    expect(errors).not.toHaveProperty("data");
  });

  it("adiciona erro para data no futuro", () => {
    const errors: Record<string, string> = {};
    dataNaoFutura(errors, "data", "2099-12-31");
    expect(errors.data).toBe("A data não pode ser no futuro.");
  });

  it("não adiciona erro quando valor é null", () => {
    const errors: Record<string, string> = {};
    dataNaoFutura(errors, "data", null);
    expect(errors).not.toHaveProperty("data");
  });

  it("usa mensagem customizada quando fornecida", () => {
    const errors: Record<string, string> = {};
    dataNaoFutura(errors, "data", "2099-12-31", "Data de nascimento não pode ser no futuro.");
    expect(errors.data).toBe("Data de nascimento não pode ser no futuro.");
  });
});

describe("emailValido", () => {
  it("não adiciona erro para email válido", () => {
    const errors: Record<string, string> = {};
    emailValido(errors, "email", "teste@example.com");
    expect(errors).not.toHaveProperty("email");
  });

  it("adiciona erro para email sem @", () => {
    const errors: Record<string, string> = {};
    emailValido(errors, "email", "teste.example.com");
    expect(errors.email).toBe("E-mail inválido.");
  });

  it("adiciona erro para email sem domínio", () => {
    const errors: Record<string, string> = {};
    emailValido(errors, "email", "teste@");
    expect(errors.email).toBe("E-mail inválido.");
  });

  it("adiciona erro para email com TLD de 1 caractere", () => {
    const errors: Record<string, string> = {};
    emailValido(errors, "email", "user@domain.c");
    expect(errors.email).toBe("E-mail inválido.");
  });

  it("não adiciona erro para email com TLD de 2 caracteres", () => {
    const errors: Record<string, string> = {};
    emailValido(errors, "email", "user@domain.co");
    expect(errors).not.toHaveProperty("email");
  });

  it("não adiciona erro quando valor é null", () => {
    const errors: Record<string, string> = {};
    emailValido(errors, "email", null);
    expect(errors).not.toHaveProperty("email");
  });

  it("não adiciona erro quando valor é undefined", () => {
    const errors: Record<string, string> = {};
    emailValido(errors, "email", undefined);
    expect(errors).not.toHaveProperty("email");
  });
});

describe("valorPermitido", () => {
  const permitidos = ["a", "b", "c"] as const;

  it("não adiciona erro quando valor está na lista", () => {
    const errors: Record<string, string> = {};
    valorPermitido(errors, "campo", "a", permitidos);
    expect(errors).not.toHaveProperty("campo");
  });

  it("adiciona erro quando valor não está na lista", () => {
    const errors: Record<string, string> = {};
    valorPermitido(errors, "campo", "x", permitidos);
    expect(errors.campo).toBe("Valor inválido.");
  });

  it("não adiciona erro quando valor é null", () => {
    const errors: Record<string, string> = {};
    valorPermitido(errors, "campo", null, permitidos);
    expect(errors).not.toHaveProperty("campo");
  });

  it("usa mensagem customizada quando fornecida", () => {
    const errors: Record<string, string> = {};
    valorPermitido(errors, "tipo", "x", permitidos, "Tipo inválido.");
    expect(errors.tipo).toBe("Tipo inválido.");
  });
});

describe("uuidValido", () => {
  it("retorna true para UUID v4 válido", () => {
    expect(uuidValido("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("retorna true para UUID com letras maiúsculas", () => {
    expect(uuidValido("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("retorna false para string curta", () => {
    expect(uuidValido("p-1")).toBe(false);
  });

  it("retorna false para string vazia", () => {
    expect(uuidValido("")).toBe(false);
  });

  it("retorna false para null", () => {
    expect(uuidValido(null)).toBe(false);
  });

  it("retorna false para undefined", () => {
    expect(uuidValido(undefined)).toBe(false);
  });

  it("retorna false para UUID sem hífens", () => {
    expect(uuidValido("550e8400e29b41d4a716446655440000")).toBe(false);
  });

  it("retorna false para UUID com caracteres inválidos", () => {
    expect(uuidValido("550e8400-e29b-41d4-a716-44665544000g")).toBe(false);
  });
});
