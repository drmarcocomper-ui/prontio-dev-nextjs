import { describe, it, expect } from "vitest";
import {
  INPUT_CLASS,
  NOME_CONSULTORIO_MAX, ENDERECO_MAX, CIDADE_MAX, ESTADO_MAX,
  CNPJ_MAX, TELEFONE_MAX, NOME_PROFISSIONAL_MAX, ESPECIALIDADE_MAX,
  CRM_MAX, RQE_MAX, EMAIL_MAX, SENHA_MIN, SENHA_MAX,
  DIAS,
  maskCNPJ, maskPhone,
} from "./constants";

describe("configuracoes/constants", () => {
  it("exporta INPUT_CLASS como string", () => {
    expect(typeof INPUT_CLASS).toBe("string");
    expect(INPUT_CLASS.length).toBeGreaterThan(0);
  });

  it("exporta constantes de tamanho máximo como números positivos", () => {
    const maxConstants = {
      NOME_CONSULTORIO_MAX, ENDERECO_MAX, CIDADE_MAX, ESTADO_MAX,
      CNPJ_MAX, TELEFONE_MAX, NOME_PROFISSIONAL_MAX, ESPECIALIDADE_MAX,
      CRM_MAX, RQE_MAX, EMAIL_MAX, SENHA_MAX,
    };
    for (const [key, value] of Object.entries(maxConstants)) {
      expect(value, key).toBeGreaterThan(0);
    }
  });

  it("SENHA_MIN é menor que SENHA_MAX", () => {
    expect(SENHA_MIN).toBeGreaterThan(0);
    expect(SENHA_MIN).toBeLessThan(SENHA_MAX);
  });

  it("DIAS contém 6 dias úteis com key e label", () => {
    expect(DIAS).toHaveLength(6);
    expect(DIAS[0]).toEqual({ key: "seg", label: "Segunda-feira" });
    expect(DIAS[5]).toEqual({ key: "sab", label: "Sábado" });
    for (const dia of DIAS) {
      expect(dia).toHaveProperty("key");
      expect(dia).toHaveProperty("label");
    }
  });

  it("re-exporta maskCNPJ e maskPhone como funções", () => {
    expect(typeof maskCNPJ).toBe("function");
    expect(typeof maskPhone).toBe("function");
  });
});
