import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { Breadcrumb } from "./breadcrumb";

describe("Breadcrumb", () => {
  it("renderiza nav com aria-label", () => {
    render(<Breadcrumb items={[{ label: "Pacientes" }]} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("renderiza link para início (home)", () => {
    render(<Breadcrumb items={[{ label: "Pacientes" }]} />);
    const homeLink = screen.getByLabelText("Início");
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renderiza item com link quando href é fornecido", () => {
    render(
      <Breadcrumb items={[
        { label: "Pacientes", href: "/pacientes" },
        { label: "Maria Silva" },
      ]} />
    );
    const link = screen.getByText("Pacientes").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes");
  });

  it("renderiza último item como texto sem link", () => {
    render(
      <Breadcrumb items={[
        { label: "Pacientes", href: "/pacientes" },
        { label: "Maria Silva" },
      ]} />
    );
    const text = screen.getByText("Maria Silva");
    expect(text.tagName).toBe("SPAN");
    expect(text.closest("a")).toBeNull();
  });

  it("renderiza múltiplos itens com separadores", () => {
    render(
      <Breadcrumb items={[
        { label: "Pacientes", href: "/pacientes" },
        { label: "Maria Silva", href: "/pacientes/123" },
        { label: "Editar" },
      ]} />
    );
    expect(screen.getByText("Pacientes")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Editar")).toBeInTheDocument();
  });

  it("renderiza item único sem link", () => {
    render(<Breadcrumb items={[{ label: "Dashboard" }]} />);
    const text = screen.getByText("Dashboard");
    expect(text.tagName).toBe("SPAN");
  });
});
