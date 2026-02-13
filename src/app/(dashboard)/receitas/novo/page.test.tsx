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

vi.mock("./receita-form", () => ({
  ReceitaForm: (props: Record<string, unknown>) => {
    const defaults = props.defaults as Record<string, string> | undefined;
    return (
      <form data-testid="receita-form" data-patient-id={defaults?.paciente_id ?? ""} data-cancel-href={props.cancelHref ?? ""} />
    );
  },
}));

import NovaReceitaPage from "./page";

async function renderPage(searchParams: { paciente_id?: string; paciente_nome?: string } = {}) {
  const jsx = await NovaReceitaPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("NovaReceitaPage", () => {
  it("renderiza o título Nova receita", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Nova receita" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para receitas", async () => {
    await renderPage();
    const link = screen.getByText("Receitas").closest("a");
    expect(link).toHaveAttribute("href", "/receitas");
  });

  it("renderiza o ReceitaForm com paciente padrão", async () => {
    await renderPage({ paciente_id: "p-1", paciente_nome: "Maria" });
    const form = screen.getByTestId("receita-form");
    expect(form).toHaveAttribute("data-patient-id", "p-1");
  });

  it("breadcrumb aponta para paciente quando vem do contexto do paciente", async () => {
    await renderPage({ paciente_id: "p-1", paciente_nome: "Maria" });
    const link = screen.getByText("Maria").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });

  it("passa cancelHref do paciente quando fornecido", async () => {
    await renderPage({ paciente_id: "p-1", paciente_nome: "Maria" });
    const form = screen.getByTestId("receita-form");
    expect(form).toHaveAttribute("data-cancel-href", "/pacientes/p-1");
  });

  it("usa 'Paciente' como fallback quando paciente_nome não é fornecido", async () => {
    await renderPage({ paciente_id: "p-1" });
    expect(screen.getByText("Paciente")).toBeInTheDocument();
    const link = screen.getByText("Paciente").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });
});
