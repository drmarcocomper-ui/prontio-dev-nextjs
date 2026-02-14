import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { SortableHeader } from "./sortable-header";

const baseProps = {
  label: "Nome",
  column: "nome",
  currentColumn: "nome",
  currentDirection: "asc" as const,
  basePath: "/pacientes",
  searchParams: {} as Record<string, string>,
};

function renderInTable(ui: React.ReactElement) {
  return render(<table><thead><tr>{ui}</tr></thead></table>);
}

describe("SortableHeader", () => {
  it("renderiza o label", () => {
    renderInTable(<SortableHeader {...baseProps} />);
    expect(screen.getByText("Nome")).toBeInTheDocument();
  });

  it("renderiza como th com scope=col", () => {
    renderInTable(<SortableHeader {...baseProps} />);
    const th = screen.getByText("Nome").closest("th");
    expect(th).toHaveAttribute("scope", "col");
  });

  it("define aria-sort=ascending quando coluna ativa e asc", () => {
    renderInTable(<SortableHeader {...baseProps} currentDirection="asc" />);
    const th = screen.getByText("Nome").closest("th");
    expect(th).toHaveAttribute("aria-sort", "ascending");
  });

  it("define aria-sort=descending quando coluna ativa e desc", () => {
    renderInTable(<SortableHeader {...baseProps} currentDirection="desc" />);
    const th = screen.getByText("Nome").closest("th");
    expect(th).toHaveAttribute("aria-sort", "descending");
  });

  it("define aria-sort=none quando coluna não ativa", () => {
    renderInTable(<SortableHeader {...baseProps} currentColumn="data" />);
    const th = screen.getByText("Nome").closest("th");
    expect(th).toHaveAttribute("aria-sort", "none");
  });

  it("alterna para desc quando coluna ativa e atualmente asc", () => {
    renderInTable(<SortableHeader {...baseProps} currentDirection="asc" />);
    const link = screen.getByText("Nome").closest("a");
    const href = link?.getAttribute("href") ?? "";
    expect(href).toContain("dir=desc");
  });

  it("alterna para asc quando coluna ativa e atualmente desc", () => {
    renderInTable(<SortableHeader {...baseProps} currentDirection="desc" />);
    const link = screen.getByText("Nome").closest("a");
    const href = link?.getAttribute("href") ?? "";
    expect(href).toContain("dir=asc");
  });

  it("usa asc quando coluna não está ativa", () => {
    renderInTable(<SortableHeader {...baseProps} currentColumn="data" />);
    const link = screen.getByText("Nome").closest("a");
    const href = link?.getAttribute("href") ?? "";
    expect(href).toContain("dir=asc");
    expect(href).toContain("ordem=nome");
  });

  it("inclui basePath no href", () => {
    renderInTable(<SortableHeader {...baseProps} />);
    const link = screen.getByText("Nome").closest("a");
    expect(link?.getAttribute("href")).toMatch(/^\/pacientes\?/);
  });

  it("remove pagina do href", () => {
    renderInTable(
      <SortableHeader
        {...baseProps}
        searchParams={{ pagina: "3", q: "test" }}
      />
    );
    const link = screen.getByText("Nome").closest("a");
    const href = link?.getAttribute("href") ?? "";
    expect(href).not.toContain("pagina=");
    expect(href).toContain("q=test");
  });

  it("aceita className customizado", () => {
    renderInTable(<SortableHeader {...baseProps} className="custom-class" />);
    const th = screen.getByText("Nome").closest("th");
    expect(th?.className).toContain("custom-class");
  });
});
