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

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT");
  },
}));

vi.mock("./atestado-form", () => ({
  AtestadoForm: (props: Record<string, unknown>) => {
    const defaults = props.defaults as Record<string, string> | undefined;
    return (
      <form data-testid="atestado-form" data-patient-id={defaults?.paciente_id ?? ""} data-cancel-href={props.cancelHref ?? ""} />
    );
  },
}));

import NovoAtestadoPage from "./page";

async function renderPage(searchParams: { paciente_id?: string; paciente_nome?: string } = {}) {
  const jsx = await NovoAtestadoPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("NovoAtestadoPage", () => {
  it("redireciona para pacientes quando paciente_id não é fornecido", async () => {
    await expect(renderPage()).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });

  it("redireciona para pacientes quando paciente_id é inválido", async () => {
    await expect(renderPage({ paciente_id: "invalido" })).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });

  it("renderiza o título Novo atestado", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", paciente_nome: "Maria" });
    expect(screen.getByRole("heading", { name: "Novo atestado" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para pacientes", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", paciente_nome: "Maria" });
    const link = screen.getByText("Pacientes").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes");
  });

  it("breadcrumb aponta para paciente quando vem do contexto do paciente", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", paciente_nome: "Maria" });
    const link = screen.getByText("Maria").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("renderiza o AtestadoForm com paciente padrão", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", paciente_nome: "Maria" });
    const form = screen.getByTestId("atestado-form");
    expect(form).toHaveAttribute("data-patient-id", "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("passa cancelHref do paciente quando fornecido", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", paciente_nome: "Maria" });
    const form = screen.getByTestId("atestado-form");
    expect(form).toHaveAttribute("data-cancel-href", "/pacientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("usa 'Paciente' como fallback quando paciente_nome não é fornecido", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" });
    expect(screen.getByText("Paciente")).toBeInTheDocument();
    const link = screen.getByText("Paciente").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });
});
