import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT");
  },
}));

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

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: ({ items }: { items: { label: string; href?: string }[] }) => (
    <nav data-testid="breadcrumb">
      {items.map((item, i) =>
        item.href ? (
          <a key={i} href={item.href}>
            {item.label}
          </a>
        ) : (
          <span key={i}>{item.label}</span>
        ),
      )}
    </nav>
  ),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "user-1" }),
}));

vi.mock("./exame-form", () => ({
  ExameForm: (props: Record<string, unknown>) => {
    const defaults = props.defaults as Record<string, string> | undefined;
    return (
      <div
        data-testid="exame-form"
        data-paciente-id={defaults?.paciente_id ?? ""}
        data-paciente-nome={defaults?.paciente_nome ?? ""}
        data-cancel-href={String(props.cancelHref ?? "")}
      />
    );
  },
}));

import NovaSolicitacaoExamePage from "./page";

const VALID_UUID = "00000000-0000-0000-0000-000000000001";

async function renderPage(
  searchParams: { paciente_id?: string; paciente_nome?: string } = {},
) {
  const jsx = await NovaSolicitacaoExamePage({
    searchParams: Promise.resolve(searchParams),
  });
  return render(jsx);
}

describe("NovaSolicitacaoExamePage", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it("redireciona para /pacientes quando paciente_id está ausente", async () => {
    await expect(renderPage()).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });

  it("redireciona para /pacientes quando paciente_id é UUID inválido", async () => {
    await expect(
      renderPage({ paciente_id: "invalid-uuid" }),
    ).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/pacientes");
  });

  it("renderiza título e breadcrumb quando paciente_id é válido", async () => {
    await renderPage({ paciente_id: VALID_UUID, paciente_nome: "Maria Silva" });
    expect(
      screen.getByRole("heading", { name: "Nova solicitação de exame" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    const pacientesLink = screen.getByText("Pacientes").closest("a");
    expect(pacientesLink).toHaveAttribute("href", "/pacientes");
  });

  it("passa defaults para ExameForm", async () => {
    await renderPage({ paciente_id: VALID_UUID, paciente_nome: "Maria Silva" });
    const form = screen.getByTestId("exame-form");
    expect(form).toHaveAttribute("data-paciente-id", VALID_UUID);
    expect(form).toHaveAttribute("data-paciente-nome", "Maria Silva");
    expect(form).toHaveAttribute(
      "data-cancel-href",
      `/pacientes/${VALID_UUID}`,
    );
  });

  it("usa paciente_nome do searchParams no breadcrumb", async () => {
    await renderPage({
      paciente_id: VALID_UUID,
      paciente_nome: "João Santos",
    });
    const link = screen.getByText("João Santos").closest("a");
    expect(link).toHaveAttribute("href", `/pacientes/${VALID_UUID}`);
  });

  it("usa 'Paciente' como fallback quando paciente_nome não é fornecido", async () => {
    await renderPage({ paciente_id: VALID_UUID });
    expect(screen.getByText("Paciente")).toBeInTheDocument();
    const link = screen.getByText("Paciente").closest("a");
    expect(link).toHaveAttribute("href", `/pacientes/${VALID_UUID}`);
  });
});
