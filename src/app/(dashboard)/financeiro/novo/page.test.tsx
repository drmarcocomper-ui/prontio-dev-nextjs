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

vi.mock("@/lib/clinica", () => ({
  getMedicoId: vi.fn().mockResolvedValue("doc-1"),
}));

vi.mock("./transacao-form", () => ({
  TransacaoForm: () => <form data-testid="transacao-form" />,
}));

import NovaTransacaoPage from "./page";

async function renderPage() {
  const jsx = await NovaTransacaoPage();
  return render(jsx);
}

describe("NovaTransacaoPage", () => {
  it("renderiza o título Nova transação", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Nova transação" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para financeiro", async () => {
    await renderPage();
    const link = screen.getByText("Financeiro").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro");
  });

  it("renderiza o TransacaoForm", async () => {
    await renderPage();
    expect(screen.getByTestId("transacao-form")).toBeInTheDocument();
  });
});
