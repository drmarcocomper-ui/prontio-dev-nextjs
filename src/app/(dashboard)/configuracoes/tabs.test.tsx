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
  it("renderiza as 3 categorias para papel gestor", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByText("Clínica")).toBeInTheDocument();
    expect(screen.getByText("Profissional")).toBeInTheDocument();
    expect(screen.getByText("Usuário")).toBeInTheDocument();
  });

  it("renderiza apenas categoria Usuário para secretaria", () => {
    mockTab = "";
    render(<Tabs papel="secretaria" />);
    expect(screen.queryByText("Clínica")).not.toBeInTheDocument();
    expect(screen.queryByText("Profissional")).not.toBeInTheDocument();
    expect(screen.getByText("Usuário")).toBeInTheDocument();
  });

  it("renderiza apenas categoria Usuário para profissional_saude", () => {
    mockTab = "";
    render(<Tabs papel="profissional_saude" />);
    expect(screen.queryByText("Clínica")).not.toBeInTheDocument();
    expect(screen.queryByText("Profissional")).not.toBeInTheDocument();
    expect(screen.getByText("Usuário")).toBeInTheDocument();
  });

  it("renderiza apenas categoria Usuário para financeiro", () => {
    mockTab = "";
    render(<Tabs papel="financeiro" />);
    expect(screen.queryByText("Clínica")).not.toBeInTheDocument();
    expect(screen.queryByText("Profissional")).not.toBeInTheDocument();
    expect(screen.getByText("Usuário")).toBeInTheDocument();
  });

  it("categorias apontam para primeira sub-aba", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByText("Clínica").closest("a")).toHaveAttribute("href", "/configuracoes?tab=consultorio");
    expect(screen.getByText("Profissional").closest("a")).toHaveAttribute("href", "/configuracoes?tab=profissional");
    expect(screen.getByText("Usuário").closest("a")).toHaveAttribute("href", "/configuracoes?tab=conta");
  });

  it("destaca categoria Clínica por padrão e mostra sub-abas", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    const catLink = screen.getByText("Clínica");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");

    expect(screen.getByText("Consultório")).toBeInTheDocument();
    expect(screen.getByText("Horários")).toBeInTheDocument();
    expect(screen.getByText("Valores")).toBeInTheDocument();
    expect(screen.getByText("Clínicas")).toBeInTheDocument();
  });

  it("sub-aba consultorio destacada por padrão", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    const subTab = screen.getByText("Consultório");
    expect(subTab.className).toContain("border-primary-600");
    expect(subTab.className).toContain("text-primary-600");
  });

  it("tab=horarios ativa categoria Clínica e destaca sub-aba Horários", () => {
    mockTab = "horarios";
    render(<Tabs papel="gestor" />);

    const catLink = screen.getByText("Clínica");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");

    expect(screen.getByText("Consultório")).toBeInTheDocument();
    expect(screen.getByText("Horários")).toBeInTheDocument();
    expect(screen.getByText("Valores")).toBeInTheDocument();
    expect(screen.getByText("Clínicas")).toBeInTheDocument();

    const activeSubTab = screen.getByText("Horários");
    expect(activeSubTab.className).toContain("border-primary-600");

    const inactiveSubTab = screen.getByText("Consultório");
    expect(inactiveSubTab.className).toContain("border-transparent");
  });

  it("tab=conta ativa categoria Usuário e mostra sub-abas", () => {
    mockTab = "conta";
    render(<Tabs papel="gestor" />);

    const catLink = screen.getByText("Usuário");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");

    const inactiveCat = screen.getByText("Clínica");
    expect(inactiveCat.className).toContain("text-gray-500");

    expect(screen.getByText("Conta")).toBeInTheDocument();
    expect(screen.getByText("Aparência")).toBeInTheDocument();
    expect(screen.getByText("Dados")).toBeInTheDocument();
  });

  it("tab=profissional ativa categoria Profissional e NÃO renderiza sub-abas", () => {
    mockTab = "profissional";
    render(<Tabs papel="gestor" />);

    const catLink = screen.getByText("Profissional");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");

    expect(screen.queryByRole("navigation", { name: "Sub-abas" })).not.toBeInTheDocument();
  });

  it("tab inválido faz fallback para default do papel", () => {
    mockTab = "invalido";
    render(<Tabs papel="gestor" />);

    // Deve cair na categoria Clínica (default para gestor)
    const catLink = screen.getByText("Clínica");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");
  });

  it("tab inválido com secretaria faz fallback para conta", () => {
    mockTab = "invalido";
    render(<Tabs papel="secretaria" />);

    // Deve cair na categoria Usuário com sub-aba Conta
    const catLink = screen.getByText("Usuário");
    expect(catLink.className).toContain("bg-white");

    const subTab = screen.getByText("Conta");
    expect(subTab.className).toContain("border-primary-600");
  });

  it("tab=valores ativa categoria Clínica e destaca sub-aba Valores", () => {
    mockTab = "valores";
    render(<Tabs papel="gestor" />);

    const catLink = screen.getByText("Clínica");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");

    const activeSubTab = screen.getByText("Valores");
    expect(activeSubTab.className).toContain("border-primary-600");

    const inactiveSubTab = screen.getByText("Consultório");
    expect(inactiveSubTab.className).toContain("border-transparent");
  });

  it("sub-abas têm hrefs corretos", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByText("Consultório").closest("a")).toHaveAttribute("href", "/configuracoes?tab=consultorio");
    expect(screen.getByText("Horários").closest("a")).toHaveAttribute("href", "/configuracoes?tab=horarios");
    expect(screen.getByText("Valores").closest("a")).toHaveAttribute("href", "/configuracoes?tab=valores");
    expect(screen.getByText("Clínicas").closest("a")).toHaveAttribute("href", "/configuracoes?tab=clinicas");
  });

  it("renderiza nav de categorias com aria-label", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByRole("navigation", { name: "Categorias" })).toBeInTheDocument();
  });

  it("renderiza nav de sub-abas com aria-label quando categoria tem múltiplas abas", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByRole("navigation", { name: "Sub-abas" })).toBeInTheDocument();
  });

  it("secretaria vê sub-abas do Usuário por padrão", () => {
    mockTab = "";
    render(<Tabs papel="secretaria" />);
    expect(screen.getByText("Conta")).toBeInTheDocument();
    expect(screen.getByText("Aparência")).toBeInTheDocument();
    expect(screen.getByText("Dados")).toBeInTheDocument();
  });
});

describe("isValidTab", () => {
  it("retorna true para tabs válidos", () => {
    expect(isValidTab("consultorio")).toBe(true);
    expect(isValidTab("horarios")).toBe(true);
    expect(isValidTab("valores")).toBe(true);
    expect(isValidTab("clinicas")).toBe(true);
    expect(isValidTab("profissional")).toBe(true);
    expect(isValidTab("conta")).toBe(true);
    expect(isValidTab("aparencia")).toBe(true);
    expect(isValidTab("dados")).toBe(true);
  });

  it("retorna false para tabs inválidos", () => {
    expect(isValidTab("invalido")).toBe(false);
    expect(isValidTab("")).toBe(false);
    expect(isValidTab("xyz")).toBe(false);
  });
});

describe("getDefaultTab", () => {
  it("retorna consultorio para gestor", () => {
    expect(getDefaultTab("gestor")).toBe("consultorio");
  });

  it("retorna consultorio para superadmin", () => {
    expect(getDefaultTab("superadmin")).toBe("consultorio");
  });

  it("retorna conta para secretaria", () => {
    expect(getDefaultTab("secretaria")).toBe("conta");
  });

  it("retorna conta para profissional_saude", () => {
    expect(getDefaultTab("profissional_saude")).toBe("conta");
  });

  it("retorna conta para financeiro", () => {
    expect(getDefaultTab("financeiro")).toBe("conta");
  });
});
