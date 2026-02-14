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
  it("renderiza as abas para papel gestor", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByText("Consultório")).toBeInTheDocument();
    expect(screen.getByText("Profissional")).toBeInTheDocument();
    expect(screen.getByText("Horários")).toBeInTheDocument();
    expect(screen.getByText("Conta")).toBeInTheDocument();
    expect(screen.getByText("Aparência")).toBeInTheDocument();
  });

  it("renderiza nenhuma aba para secretaria", () => {
    mockTab = "";
    render(<Tabs papel="secretaria" />);
    expect(screen.queryByText("Conta")).not.toBeInTheDocument();
    expect(screen.queryByText("Consultório")).not.toBeInTheDocument();
    expect(screen.queryByText("Profissional")).not.toBeInTheDocument();
    expect(screen.queryByText("Horários")).not.toBeInTheDocument();
    expect(screen.queryByText("Aparência")).not.toBeInTheDocument();
    expect(screen.queryByText("Clínicas")).not.toBeInTheDocument();
    expect(screen.queryByText("Dados")).not.toBeInTheDocument();
  });

  it("cada aba aponta para o href correto", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByText("Consultório").closest("a")).toHaveAttribute("href", "/configuracoes?tab=consultorio");
    expect(screen.getByText("Profissional").closest("a")).toHaveAttribute("href", "/configuracoes?tab=profissional");
    expect(screen.getByText("Horários").closest("a")).toHaveAttribute("href", "/configuracoes?tab=horarios");
    expect(screen.getByText("Conta").closest("a")).toHaveAttribute("href", "/configuracoes?tab=conta");
    expect(screen.getByText("Aparência").closest("a")).toHaveAttribute("href", "/configuracoes?tab=aparencia");
  });

  it("destaca a aba consultorio por padrão", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    const link = screen.getByText("Consultório");
    expect(link.className).toContain("bg-white");
    expect(link.className).toContain("text-primary-600");
  });

  it("destaca a aba selecionada via searchParams", () => {
    mockTab = "horarios";
    render(<Tabs papel="gestor" />);
    const active = screen.getByText("Horários");
    expect(active.className).toContain("bg-white");
    expect(active.className).toContain("text-primary-600");
    const inactive = screen.getByText("Consultório");
    expect(inactive.className).toContain("text-gray-500");
  });

  it("renderiza nav com aria-label", () => {
    mockTab = "";
    render(<Tabs papel="gestor" />);
    expect(screen.getByRole("navigation", { name: "Tabs" })).toBeInTheDocument();
  });
});
