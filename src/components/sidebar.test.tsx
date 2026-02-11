import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
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

vi.mock("@/components/logout-button", () => ({
  LogoutButton: () => <button>Sair</button>,
}));

import { Sidebar } from "./sidebar";

const navItems = [
  { label: "Início", href: "/" },
  { label: "Agenda", href: "/agenda" },
  { label: "Pacientes", href: "/pacientes" },
  { label: "Prontuários", href: "/prontuarios" },
  { label: "Financeiro", href: "/financeiro" },
  { label: "Configurações", href: "/configuracoes" },
];

describe("Sidebar", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("renderiza o logo e nome Prontio", () => {
    render(<Sidebar />);
    expect(screen.getByText("P")).toBeInTheDocument();
    expect(screen.getByText("Prontio")).toBeInTheDocument();
  });

  it("renderiza todos os 6 links de navegação", () => {
    render(<Sidebar />);
    for (const item of navItems) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it("cada link aponta para o href correto", () => {
    render(<Sidebar />);
    for (const item of navItems) {
      const link = screen.getByText(item.label).closest("a");
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("destaca o link Início quando pathname é /", () => {
    mockPathname = "/";
    render(<Sidebar />);
    const link = screen.getByText("Início").closest("a");
    expect(link?.className).toContain("bg-sky-50");
    expect(link?.className).toContain("text-sky-700");
  });

  it("destaca links de seções quando pathname começa com o href", () => {
    mockPathname = "/pacientes/123";
    render(<Sidebar />);
    const link = screen.getByText("Pacientes").closest("a");
    expect(link?.className).toContain("bg-sky-50");
    expect(link?.className).toContain("text-sky-700");
  });

  it("não destaca Início quando está em outra rota", () => {
    mockPathname = "/agenda";
    render(<Sidebar />);
    const link = screen.getByText("Início").closest("a");
    expect(link?.className).not.toContain("bg-sky-50");
    expect(link?.className).toContain("text-gray-600");
  });

  it("renderiza o LogoutButton", () => {
    render(<Sidebar />);
    expect(screen.getByText("Sair")).toBeInTheDocument();
  });
});
