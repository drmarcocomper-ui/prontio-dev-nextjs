import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

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

vi.mock("./transacao-form", () => ({
  TransacaoForm: () => <form data-testid="transacao-form" />,
}));

import NovaTransacaoPage from "./page";

describe("NovaTransacaoPage", () => {
  it("renderiza o título Nova transação", () => {
    render(<NovaTransacaoPage />);
    expect(screen.getByRole("heading", { name: "Nova transação" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para financeiro", () => {
    render(<NovaTransacaoPage />);
    const link = screen.getByText("Financeiro").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro");
  });

  it("renderiza o TransacaoForm", () => {
    render(<NovaTransacaoPage />);
    expect(screen.getByTestId("transacao-form")).toBeInTheDocument();
  });
});
