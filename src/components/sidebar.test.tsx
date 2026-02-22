import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Clinica, Papel } from "@/lib/clinica";

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

vi.mock("@/app/login/actions", () => ({
  logout: vi.fn(),
}));

vi.mock("@/app/(dashboard)/usuarios/types", () => ({
  PAPEL_BADGE: {
    superadmin: { label: "Superadmin", className: "bg-purple-50 text-purple-700" },
    gestor: { label: "Gestor", className: "bg-indigo-50 text-indigo-700" },
    profissional_saude: { label: "Médico", className: "bg-primary-50 text-primary-700" },
    financeiro: { label: "Financeiro", className: "bg-green-50 text-green-700" },
    secretaria: { label: "Secretária", className: "bg-amber-50 text-amber-700" },
  },
}));

vi.mock("@/components/clinic-selector", () => ({
  ClinicSelector: ({ clinicas, clinicaAtualId }: { clinicas: Clinica[]; clinicaAtualId: string }) => {
    const current = clinicas.find((c: Clinica) => c.id === clinicaAtualId) ?? clinicas[0];
    return <div>{current?.nome}</div>;
  },
}));

import { Sidebar } from "./sidebar";

const defaultClinicas: Clinica[] = [
  { id: "clinic-1", nome: "Clínica Teste", papel: "superadmin" as const },
];
const defaultClinicaAtualId = "clinic-1";
const defaultPapel: Papel = "superadmin" as const;

const defaultProps = {
  profissionalNome: "Dr. João Silva",
  userEmail: "joao@test.com",
  clinicas: defaultClinicas,
  clinicaAtualId: defaultClinicaAtualId,
  papel: defaultPapel,
};

const navItems = [
  { label: "Início", href: "/" },
  { label: "Agenda", href: "/agenda" },
  { label: "Pacientes", href: "/pacientes" },
  { label: "Financeiro", href: "/financeiro" },
  { label: "Relatórios", href: "/relatorios/financeiro" },
  { label: "Produtividade", href: "/relatorios/produtividade" },
  { label: "Configurações", href: "/configuracoes" },
];

describe("Sidebar", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("renderiza o logo e nome Prontio", () => {
    render(<Sidebar {...defaultProps} />);
    // Mobile top bar + desktop sidebar both render logo
    expect(screen.getAllByText("P").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Prontio").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza todos os 7 links de navegação quando papel é superadmin", () => {
    render(<Sidebar {...defaultProps} papel={"superadmin" as const} />);
    for (const item of navItems) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it("cada link aponta para o href correto", () => {
    render(<Sidebar {...defaultProps} />);
    for (const item of navItems) {
      const link = screen.getByText(item.label).closest("a");
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("destaca o link Início quando pathname é /", () => {
    mockPathname = "/";
    render(<Sidebar {...defaultProps} />);
    const link = screen.getByText("Início").closest("a");
    expect(link?.className).toContain("bg-primary-50");
    expect(link?.className).toContain("text-primary-700");
  });

  it("destaca links de seções quando pathname começa com o href", () => {
    mockPathname = "/pacientes/123";
    render(<Sidebar {...defaultProps} />);
    const link = screen.getByText("Pacientes").closest("a");
    expect(link?.className).toContain("bg-primary-50");
    expect(link?.className).toContain("text-primary-700");
  });

  it("não destaca Início quando está em outra rota", () => {
    mockPathname = "/agenda";
    render(<Sidebar {...defaultProps} />);
    const link = screen.getByText("Início").closest("a");
    expect(link?.className).not.toContain("bg-primary-50");
    expect(link?.className).toContain("text-gray-600");
  });

  it("renderiza o nome do profissional no rodapé", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getAllByText("Dr. João Silva").length).toBeGreaterThanOrEqual(1);
  });

  describe("visibilidade por papel", () => {
    it("quando papel=superadmin, exibe todos os itens de navegação", () => {
      render(<Sidebar {...defaultProps} papel={"superadmin" as const} />);
      for (const item of navItems) {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      }
    });

    it("quando papel=profissional_saude, oculta Financeiro", () => {
      render(<Sidebar {...defaultProps} papel={"profissional_saude" as const} />);

      expect(screen.getByText("Início")).toBeInTheDocument();
      expect(screen.getByText("Agenda")).toBeInTheDocument();
      expect(screen.getByText("Pacientes")).toBeInTheDocument();
      expect(screen.getByText("Relatórios")).toBeInTheDocument();
      expect(screen.getByText("Produtividade")).toBeInTheDocument();
      expect(screen.getByText("Configurações")).toBeInTheDocument();

      expect(screen.queryByText("Financeiro")).not.toBeInTheDocument();
    });

    it("quando papel=secretaria, oculta Financeiro, Relatórios e Produtividade", () => {
      render(<Sidebar {...defaultProps} papel={"secretaria" as const} />);

      expect(screen.getByText("Início")).toBeInTheDocument();
      expect(screen.getByText("Agenda")).toBeInTheDocument();
      expect(screen.getByText("Pacientes")).toBeInTheDocument();
      expect(screen.getByText("Configurações")).toBeInTheDocument();

      expect(screen.queryByText("Financeiro")).not.toBeInTheDocument();
      expect(screen.queryByText("Relatórios")).not.toBeInTheDocument();
      expect(screen.queryByText("Produtividade")).not.toBeInTheDocument();
    });
  });
});
