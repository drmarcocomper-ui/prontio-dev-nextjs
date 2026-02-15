import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { ModuleNotFound } from "./module-not-found";

describe("ModuleNotFound", () => {
  it("renderiza título Não encontrado", () => {
    render(<ModuleNotFound backHref="/pacientes" backLabel="Voltar" />);
    expect(screen.getByText("Não encontrado")).toBeInTheDocument();
  });

  it("renderiza mensagem descritiva", () => {
    render(<ModuleNotFound backHref="/pacientes" backLabel="Voltar" />);
    expect(screen.getByText("O registro que você procura não existe ou foi removido.")).toBeInTheDocument();
  });

  it("renderiza link de voltar com href e label corretos", () => {
    render(<ModuleNotFound backHref="/agenda" backLabel="Ir para agenda" />);
    const link = screen.getByText("Ir para agenda").closest("a");
    expect(link).toHaveAttribute("href", "/agenda");
  });
});
