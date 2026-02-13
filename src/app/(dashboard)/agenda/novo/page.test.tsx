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

vi.mock("./agendamento-form", () => ({
  AgendamentoForm: ({ defaultDate }: { defaultDate: string }) => (
    <form data-testid="agendamento-form" data-date={defaultDate} />
  ),
}));

import NovoAgendamentoPage from "./page";

async function renderPage(searchParams: { data?: string } = {}) {
  const jsx = await NovoAgendamentoPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("NovoAgendamentoPage", () => {
  it("renderiza o título Novo agendamento", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Novo agendamento" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para agenda com data", async () => {
    await renderPage({ data: "2024-06-15" });
    const link = screen.getByText("Agenda").closest("a");
    expect(link).toHaveAttribute("href", "/agenda?data=2024-06-15");
  });

  it("renderiza o AgendamentoForm com data padrão", async () => {
    await renderPage({ data: "2024-06-15" });
    const form = screen.getByTestId("agendamento-form");
    expect(form).toHaveAttribute("data-date", "2024-06-15");
  });
});
