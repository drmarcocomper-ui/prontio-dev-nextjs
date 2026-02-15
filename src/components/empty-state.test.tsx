import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { EmptyState, EmptyStateIllustration } from "./empty-state";

describe("EmptyStateIllustration", () => {
  it.each(["pacientes", "agenda", "prontuarios", "receitas", "financeiro", "usuarios"] as const)(
    "renderiza ilustração para tipo %s",
    (type) => {
      const { container } = render(<EmptyStateIllustration type={type} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    }
  );
});

describe("EmptyState", () => {
  it("renderiza título e descrição", () => {
    render(
      <EmptyState
        icon="pacientes"
        title="Nenhum paciente"
        description="Cadastre o primeiro paciente."
      />
    );
    expect(screen.getByText("Nenhum paciente")).toBeInTheDocument();
    expect(screen.getByText("Cadastre o primeiro paciente.")).toBeInTheDocument();
  });

  it("renderiza ilustração SVG", () => {
    const { container } = render(
      <EmptyState
        icon="agenda"
        title="Sem agendamentos"
        description="Nenhum agendamento encontrado."
      />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renderiza botão de ação quando actionLabel e actionHref são fornecidos", () => {
    render(
      <EmptyState
        icon="pacientes"
        title="Nenhum paciente"
        description="Cadastre o primeiro paciente."
        actionLabel="Novo paciente"
        actionHref="/pacientes/novo"
      />
    );
    const link = screen.getByText("Novo paciente").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/novo");
  });

  it("não renderiza botão de ação quando actionLabel não é fornecido", () => {
    render(
      <EmptyState
        icon="financeiro"
        title="Sem transações"
        description="Nenhuma transação registrada."
      />
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("não renderiza botão de ação quando apenas actionLabel é fornecido sem actionHref", () => {
    render(
      <EmptyState
        icon="financeiro"
        title="Sem transações"
        description="Nenhuma transação registrada."
        actionLabel="Nova transação"
      />
    );
    expect(screen.queryByText("Nova transação")).not.toBeInTheDocument();
  });
});
