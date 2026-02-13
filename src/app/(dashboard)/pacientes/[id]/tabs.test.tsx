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
  it("renderiza as 2 abas", () => {
    mockTab = "";
    render(<Tabs pacienteId="abc-123" />);
    expect(screen.getByText("Identificação")).toBeInTheDocument();
    expect(screen.getByText("Prontuário")).toBeInTheDocument();
  });

  it("cada aba aponta para o href correto com pacienteId", () => {
    mockTab = "";
    render(<Tabs pacienteId="abc-123" />);
    expect(screen.getByText("Identificação").closest("a")).toHaveAttribute("href", "/pacientes/abc-123?tab=identificacao");
    expect(screen.getByText("Prontuário").closest("a")).toHaveAttribute("href", "/pacientes/abc-123?tab=prontuario");
  });

  it("destaca a aba identificacao por padrão", () => {
    mockTab = "";
    render(<Tabs pacienteId="abc-123" />);
    const link = screen.getByText("Identificação");
    expect(link.className).toContain("border-sky-600");
    expect(link.className).toContain("text-sky-600");
  });

  it("destaca a aba selecionada via searchParams", () => {
    mockTab = "prontuario";
    render(<Tabs pacienteId="abc-123" />);
    const active = screen.getByText("Prontuário");
    expect(active.className).toContain("border-sky-600");
    const inactive = screen.getByText("Identificação");
    expect(inactive.className).toContain("border-transparent");
  });

  it("renderiza nav com aria-label", () => {
    mockTab = "";
    render(<Tabs pacienteId="abc-123" />);
    expect(screen.getByRole("navigation", { name: "Tabs" })).toBeInTheDocument();
  });
});
