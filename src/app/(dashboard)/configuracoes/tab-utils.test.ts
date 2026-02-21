import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/clinica", () => ({
  // Only the type is used, no runtime functions needed
}));

import { isValidTab, getDefaultTab, TABS } from "./tab-utils";

describe("TABS", () => {
  it("contém 7 abas", () => {
    expect(TABS).toHaveLength(7);
  });

  it("contém as abas esperadas", () => {
    const keys = TABS.map((t) => t.key);
    expect(keys).toEqual(["clinica", "minha-conta", "medicamentos", "exames", "profissionais", "gestao", "usuarios"]);
  });

  it("cada aba tem key, label e roles", () => {
    TABS.forEach((tab) => {
      expect(tab.key).toBeTruthy();
      expect(tab.label).toBeTruthy();
      expect(Array.isArray(tab.roles)).toBe(true);
      expect(tab.roles.length).toBeGreaterThan(0);
    });
  });

  it("aba clinica é acessível por superadmin e gestor", () => {
    const clinica = TABS.find((t) => t.key === "clinica");
    expect(clinica?.roles).toEqual(["superadmin", "gestor"]);
  });

  it("aba minha-conta é acessível por todos os papéis", () => {
    const minhaConta = TABS.find((t) => t.key === "minha-conta");
    expect(minhaConta?.roles).toEqual(["superadmin", "gestor", "profissional_saude", "financeiro", "secretaria"]);
  });

  it("aba medicamentos é acessível apenas por superadmin", () => {
    const medicamentos = TABS.find((t) => t.key === "medicamentos");
    expect(medicamentos?.roles).toEqual(["superadmin"]);
  });

  it("aba exames é acessível apenas por superadmin", () => {
    const exames = TABS.find((t) => t.key === "exames");
    expect(exames?.roles).toEqual(["superadmin"]);
  });

  it("aba encaminhamentos é acessível apenas por superadmin", () => {
    const encaminhamentos = TABS.find((t) => t.key === "profissionais");
    expect(encaminhamentos?.roles).toEqual(["superadmin"]);
  });

  it("aba gestao é acessível por superadmin e gestor", () => {
    const gestao = TABS.find((t) => t.key === "gestao");
    expect(gestao?.roles).toEqual(["superadmin", "gestor"]);
  });

  it("aba usuarios é acessível por superadmin e gestor", () => {
    const usuarios = TABS.find((t) => t.key === "usuarios");
    expect(usuarios?.roles).toEqual(["superadmin", "gestor"]);
  });
});

describe("isValidTab", () => {
  it("retorna true para tab válida", () => {
    expect(isValidTab("clinica")).toBe(true);
    expect(isValidTab("minha-conta")).toBe(true);
    expect(isValidTab("medicamentos")).toBe(true);
    expect(isValidTab("exames")).toBe(true);
    expect(isValidTab("profissionais")).toBe(true);
    expect(isValidTab("gestao")).toBe(true);
    expect(isValidTab("usuarios")).toBe(true);
  });

  it("retorna false para tab inválida", () => {
    expect(isValidTab("invalido")).toBe(false);
    expect(isValidTab("")).toBe(false);
    expect(isValidTab("CLINICA")).toBe(false);
  });

  it("retorna false para string vazia", () => {
    expect(isValidTab("")).toBe(false);
  });
});

describe("getDefaultTab", () => {
  it("retorna clinica para superadmin", () => {
    expect(getDefaultTab("superadmin")).toBe("clinica");
  });

  it("retorna clinica para gestor", () => {
    expect(getDefaultTab("gestor")).toBe("clinica");
  });

  it("retorna minha-conta para profissional_saude", () => {
    expect(getDefaultTab("profissional_saude")).toBe("minha-conta");
  });

  it("retorna minha-conta para financeiro", () => {
    expect(getDefaultTab("financeiro")).toBe("minha-conta");
  });

  it("retorna minha-conta para secretaria", () => {
    expect(getDefaultTab("secretaria")).toBe("minha-conta");
  });

  it("retorna minha-conta para papel desconhecido", () => {
    expect(getDefaultTab("desconhecido" as never)).toBe("minha-conta");
  });
});
