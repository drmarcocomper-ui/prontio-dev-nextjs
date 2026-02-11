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
  it("renderiza as 4 abas", () => {
    mockTab = "";
    render(<Tabs />);
    expect(screen.getByText("Consultório")).toBeInTheDocument();
    expect(screen.getByText("Profissional")).toBeInTheDocument();
    expect(screen.getByText("Horários")).toBeInTheDocument();
    expect(screen.getByText("Conta")).toBeInTheDocument();
  });

  it("cada aba aponta para o href correto", () => {
    mockTab = "";
    render(<Tabs />);
    expect(screen.getByText("Consultório").closest("a")).toHaveAttribute("href", "/configuracoes?tab=consultorio");
    expect(screen.getByText("Profissional").closest("a")).toHaveAttribute("href", "/configuracoes?tab=profissional");
    expect(screen.getByText("Horários").closest("a")).toHaveAttribute("href", "/configuracoes?tab=horarios");
    expect(screen.getByText("Conta").closest("a")).toHaveAttribute("href", "/configuracoes?tab=conta");
  });

  it("destaca a aba consultorio por padrão", () => {
    mockTab = "";
    render(<Tabs />);
    const link = screen.getByText("Consultório");
    expect(link.className).toContain("border-sky-600");
    expect(link.className).toContain("text-sky-600");
  });

  it("destaca a aba selecionada via searchParams", () => {
    mockTab = "horarios";
    render(<Tabs />);
    const active = screen.getByText("Horários");
    expect(active.className).toContain("border-sky-600");
    const inactive = screen.getByText("Consultório");
    expect(inactive.className).toContain("border-transparent");
  });

  it("renderiza nav com aria-label", () => {
    mockTab = "";
    render(<Tabs />);
    expect(screen.getByRole("navigation", { name: "Tabs" })).toBeInTheDocument();
  });
});
