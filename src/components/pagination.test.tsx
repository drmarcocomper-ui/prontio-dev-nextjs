import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { Pagination } from "./pagination";

const baseProps = {
  currentPage: 1,
  totalPages: 5,
  totalItems: 100,
  pageSize: 20,
  basePath: "/pacientes",
  searchParams: {} as Record<string, string>,
};

describe("Pagination", () => {
  it("retorna null quando totalPages <= 1", () => {
    const { container } = render(
      <Pagination {...baseProps} totalPages={1} totalItems={10} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renderiza a navegação de paginação", () => {
    render(<Pagination {...baseProps} />);
    expect(screen.getByLabelText("Paginação")).toBeInTheDocument();
  });

  it("mostra texto 'Mostrando 1–20 de 100'", () => {
    render(<Pagination {...baseProps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("mostra página atual e total", () => {
    render(<Pagination {...baseProps} currentPage={3} />);
    expect(screen.getByText(/Página 3 de 5/)).toBeInTheDocument();
  });

  it("desabilita botão Anterior na primeira página", () => {
    render(<Pagination {...baseProps} currentPage={1} />);
    const anterior = screen.getByText("Anterior");
    expect(anterior.closest("a")).toBeNull();
    expect(anterior.closest("span")).toBeInTheDocument();
  });

  it("habilita botão Anterior na segunda página", () => {
    render(<Pagination {...baseProps} currentPage={2} />);
    const anterior = screen.getByText("Anterior").closest("a");
    expect(anterior).toBeInTheDocument();
  });

  it("desabilita botão Próximo na última página", () => {
    render(<Pagination {...baseProps} currentPage={5} />);
    const proximo = screen.getByText("Próximo");
    expect(proximo.closest("a")).toBeNull();
    expect(proximo.closest("span")).toBeInTheDocument();
  });

  it("habilita botão Próximo quando não é a última página", () => {
    render(<Pagination {...baseProps} currentPage={3} />);
    const proximo = screen.getByText("Próximo").closest("a");
    expect(proximo).toBeInTheDocument();
  });

  it("gera href correto para página anterior", () => {
    render(<Pagination {...baseProps} currentPage={3} />);
    const anterior = screen.getByText("Anterior").closest("a");
    expect(anterior).toHaveAttribute("href", "/pacientes?pagina=2");
  });

  it("gera href correto para próxima página", () => {
    render(<Pagination {...baseProps} currentPage={3} />);
    const proximo = screen.getByText("Próximo").closest("a");
    expect(proximo).toHaveAttribute("href", "/pacientes?pagina=4");
  });

  it("omite pagina=1 no href da primeira página", () => {
    render(<Pagination {...baseProps} currentPage={2} />);
    const anterior = screen.getByText("Anterior").closest("a");
    expect(anterior).toHaveAttribute("href", "/pacientes");
  });

  it("preserva searchParams no href", () => {
    render(
      <Pagination
        {...baseProps}
        currentPage={2}
        searchParams={{ q: "teste", ordem: "nome" }}
      />
    );
    const proximo = screen.getByText("Próximo").closest("a");
    const href = proximo?.getAttribute("href") ?? "";
    expect(href).toContain("q=teste");
    expect(href).toContain("ordem=nome");
    expect(href).toContain("pagina=3");
  });

  it("calcula 'to' corretamente na última página", () => {
    render(
      <Pagination {...baseProps} currentPage={5} totalItems={93} />
    );
    // Page 5: from=81, to=min(100,93)=93 → "Mostrando 81–93 de 93"
    const nav = screen.getByLabelText("Paginação");
    expect(nav.textContent).toContain("81");
    expect(nav.textContent).toContain("93");
  });
});
