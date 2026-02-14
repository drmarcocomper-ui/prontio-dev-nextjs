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

import { Tabs } from "./tabs";

describe("Tabs", () => {
  it("renderiza as 3 categorias para papel gestor", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByText("Clínica")).toBeInTheDocument();
    expect(screen.getByText("Profissional")).toBeInTheDocument();
    expect(screen.getByText("Usuário")).toBeInTheDocument();
  });

  it("renderiza nenhuma categoria para secretaria", () => {
    mockTab = "";
    render(<Tabs papel="secretaria" />);
    expect(screen.queryByText("Clínica")).not.toBeInTheDocument();
    expect(screen.queryByText("Profissional")).not.toBeInTheDocument();
    expect(screen.queryByText("Usuário")).not.toBeInTheDocument();
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

    // Sub-abas da categoria Clínica devem estar visíveis
    expect(screen.getByText("Consultório")).toBeInTheDocument();
    expect(screen.getByText("Horários")).toBeInTheDocument();
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

    // Categoria Clínica ativa
    const catLink = screen.getByText("Clínica");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");

    // Sub-abas da Clínica visíveis
    expect(screen.getByText("Consultório")).toBeInTheDocument();
    expect(screen.getByText("Horários")).toBeInTheDocument();
    expect(screen.getByText("Clínicas")).toBeInTheDocument();

    // Horários destacada
    const activeSubTab = screen.getByText("Horários");
    expect(activeSubTab.className).toContain("border-primary-600");

    // Consultório não destacada
    const inactiveSubTab = screen.getByText("Consultório");
    expect(inactiveSubTab.className).toContain("border-transparent");
  });

  it("tab=conta ativa categoria Usuário e mostra sub-abas", () => {
    mockTab = "conta";
    render(<Tabs papel="gestor" />);

    // Categoria Usuário ativa
    const catLink = screen.getByText("Usuário");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");

    // Categoria Clínica inativa
    const inactiveCat = screen.getByText("Clínica");
    expect(inactiveCat.className).toContain("text-gray-500");

    // Sub-abas do Usuário visíveis
    expect(screen.getByText("Conta")).toBeInTheDocument();
    expect(screen.getByText("Aparência")).toBeInTheDocument();
    expect(screen.getByText("Dados")).toBeInTheDocument();
  });

  it("tab=profissional ativa categoria Profissional e NÃO renderiza sub-abas", () => {
    mockTab = "profissional";
    render(<Tabs papel="gestor" />);

    // Categoria Profissional ativa
    const catLink = screen.getByText("Profissional");
    expect(catLink.className).toContain("bg-white");
    expect(catLink.className).toContain("text-primary-600");

    // Não deve existir nav de sub-abas
    expect(screen.queryByRole("navigation", { name: "Sub-abas" })).not.toBeInTheDocument();
  });

  it("sub-abas têm hrefs corretos", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByText("Consultório").closest("a")).toHaveAttribute("href", "/configuracoes?tab=consultorio");
    expect(screen.getByText("Horários").closest("a")).toHaveAttribute("href", "/configuracoes?tab=horarios");
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
});
