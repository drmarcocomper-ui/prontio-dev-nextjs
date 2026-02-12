import { describe, it, expect } from "vitest";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, emailValido } from "./validators";

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
    const today = new Date().toISOString().split("T")[0];
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
