import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

let mockTab = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mockTab ? `tab=${mockTab}` : ""),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { Tabs, isValidTab, getDefaultTab } from "./tabs";

describe("Tabs", () => {
  it("renderiza todas as 5 abas para superadmin", () => {
    mockTab = "";
    render(<Tabs papel="superadmin" />);
    expect(screen.getByText("Clínica")).toBeInTheDocument();
    expect(screen.getByText("Minha Conta")).toBeInTheDocument();
    expect(screen.getByText("Medicamentos")).toBeInTheDocument();
    expect(screen.getByText("Exames")).toBeInTheDocument();
    expect(screen.getByText("Gestão")).toBeInTheDocument();
  });

  it("renderiza 3 abas para gestor (Clínica, Minha Conta, Gestão)", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByText("Clínica")).toBeInTheDocument();
    expect(screen.getByText("Minha Conta")).toBeInTheDocument();
    expect(screen.getByText("Gestão")).toBeInTheDocument();
    expect(screen.queryByText("Medicamentos")).not.toBeInTheDocument();
    expect(screen.queryByText("Exames")).not.toBeInTheDocument();
  });

  it("renderiza apenas Minha Conta para secretaria", () => {
    mockTab = "";
    render(<Tabs papel="secretaria" />);
    expect(screen.getByText("Minha Conta")).toBeInTheDocument();
    expect(screen.queryByText("Clínica")).not.toBeInTheDocument();
    expect(screen.queryByText("Gestão")).not.toBeInTheDocument();
  });

  it("renderiza apenas Minha Conta para profissional_saude", () => {
    mockTab = "";
    render(<Tabs papel="profissional_saude" />);
    expect(screen.getByText("Minha Conta")).toBeInTheDocument();
    expect(screen.queryByText("Clínica")).not.toBeInTheDocument();
  });

  it("renderiza apenas Minha Conta para financeiro", () => {
    mockTab = "";
    render(<Tabs papel="financeiro" />);
    expect(screen.getByText("Minha Conta")).toBeInTheDocument();
    expect(screen.queryByText("Clínica")).not.toBeInTheDocument();
  });

  it("destaca aba Clínica por padrão para gestor", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    const tab = screen.getByText("Clínica");
    expect(tab.className).toContain("bg-white");
    expect(tab.className).toContain("text-primary-600");
  });

  it("destaca aba Minha Conta por padrão para secretaria", () => {
    mockTab = "";
    render(<Tabs papel="secretaria" />);
    const tab = screen.getByText("Minha Conta");
    expect(tab.className).toContain("bg-white");
    expect(tab.className).toContain("text-primary-600");
  });

  it("tab=minha-conta destaca Minha Conta e desativa Clínica", () => {
    mockTab = "minha-conta";
    render(<Tabs papel="gestor" />);
    const active = screen.getByText("Minha Conta");
    expect(active.className).toContain("bg-white");
    expect(active.className).toContain("text-primary-600");

    const inactive = screen.getByText("Clínica");
    expect(inactive.className).toContain("text-gray-500");
  });

  it("tab inválido faz fallback para default do papel", () => {
    mockTab = "invalido";
    render(<Tabs papel="gestor" />);
    const tab = screen.getByText("Clínica");
    expect(tab.className).toContain("bg-white");
    expect(tab.className).toContain("text-primary-600");
  });

  it("tab inválido com secretaria faz fallback para minha-conta", () => {
    mockTab = "invalido";
    render(<Tabs papel="secretaria" />);
    const tab = screen.getByText("Minha Conta");
    expect(tab.className).toContain("bg-white");
    expect(tab.className).toContain("text-primary-600");
  });

  it("abas têm hrefs corretos", () => {
    mockTab = "";
    render(<Tabs papel="superadmin" />);
    expect(screen.getByText("Clínica").closest("a")).toHaveAttribute("href", "/configuracoes?tab=clinica");
    expect(screen.getByText("Minha Conta").closest("a")).toHaveAttribute("href", "/configuracoes?tab=minha-conta");
    expect(screen.getByText("Medicamentos").closest("a")).toHaveAttribute("href", "/configuracoes?tab=medicamentos");
    expect(screen.getByText("Exames").closest("a")).toHaveAttribute("href", "/configuracoes?tab=exames");
    expect(screen.getByText("Gestão").closest("a")).toHaveAttribute("href", "/configuracoes?tab=gestao");
  });

  it("renderiza nav com aria-label", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByRole("navigation", { name: "Configurações" })).toBeInTheDocument();
  });
});

describe("isValidTab", () => {
  it("retorna true para tabs válidos", () => {
    expect(isValidTab("clinica")).toBe(true);
    expect(isValidTab("minha-conta")).toBe(true);
    expect(isValidTab("medicamentos")).toBe(true);
    expect(isValidTab("exames")).toBe(true);
    expect(isValidTab("gestao")).toBe(true);
  });

  it("retorna false para tabs inválidos", () => {
    expect(isValidTab("invalido")).toBe(false);
    expect(isValidTab("")).toBe(false);
    expect(isValidTab("consultorio")).toBe(false);
    expect(isValidTab("horarios")).toBe(false);
  });
});

describe("getDefaultTab", () => {
  it("retorna clinica para gestor", () => {
    expect(getDefaultTab("gestor")).toBe("clinica");
  });

  it("retorna clinica para superadmin", () => {
    expect(getDefaultTab("superadmin")).toBe("clinica");
  });

  it("retorna minha-conta para secretaria", () => {
    expect(getDefaultTab("secretaria")).toBe("minha-conta");
  });

  it("retorna minha-conta para profissional_saude", () => {
    expect(getDefaultTab("profissional_saude")).toBe("minha-conta");
  });

  it("retorna minha-conta para financeiro", () => {
    expect(getDefaultTab("financeiro")).toBe("minha-conta");
  });
});
