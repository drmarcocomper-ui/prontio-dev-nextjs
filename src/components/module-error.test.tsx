import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { ModuleError } from "./module-error";

describe("ModuleError", () => {
  it("renderiza título de erro", () => {
    render(<ModuleError reset={vi.fn()} backHref="/pacientes" backLabel="Voltar" />);
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
  });

  it("renderiza mensagem descritiva", () => {
    render(<ModuleError reset={vi.fn()} backHref="/pacientes" backLabel="Voltar" />);
    expect(screen.getByText("Ocorreu um erro inesperado. Tente novamente.")).toBeInTheDocument();
  });

  it("renderiza botão Tentar novamente e chama reset ao clicar", async () => {
    const reset = vi.fn();
    render(<ModuleError reset={reset} backHref="/pacientes" backLabel="Voltar" />);
    const button = screen.getByText("Tentar novamente");
    await userEvent.click(button);
    expect(reset).toHaveBeenCalledOnce();
  });

  it("renderiza link de voltar com href e label corretos", () => {
    render(<ModuleError reset={vi.fn()} backHref="/financeiro" backLabel="Ir para financeiro" />);
    const link = screen.getByText("Ir para financeiro").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro");
  });
});
