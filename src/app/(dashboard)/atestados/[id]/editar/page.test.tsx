import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

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

const mockNotFound = vi.fn();
vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "doc-1" }),
}));

vi.mock("../../novo/atestado-form", () => ({
  AtestadoForm: ({ defaults }: { defaults: Record<string, unknown> }) => (
    <form data-testid="atestado-form" data-defaults={JSON.stringify(defaults)} />
  ),
}));

let mockAtestado: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockAtestado }),
          }),
        }),
      }),
    }),
}));

import EditarAtestadoPage from "./page";

const atestadoMock = {
  id: "at-123",
  data: "2024-06-15",
  tipo: "afastamento",
  conteudo: "Paciente necessita de afastamento.",
  cid: "J06.9",
  dias_afastamento: 3,
  observacoes: "Retorno em 5 dias",
  pacientes: {
    id: "pac-456",
    nome: "Maria Silva",
  },
};

async function renderPage(id = "at-123") {
  const jsx = await EditarAtestadoPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarAtestadoPage", () => {
  beforeEach(() => {
    mockAtestado = atestadoMock;
    mockNotFound.mockClear();
  });

  it("chama notFound quando atestado não existe", async () => {
    mockAtestado = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar atestado", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Editar atestado" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para o paciente", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/pac-456");
  });

  it("renderiza o AtestadoForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("atestado-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.id).toBe("at-123");
    expect(defaults.paciente_id).toBe("pac-456");
    expect(defaults.paciente_nome).toBe("Maria Silva");
    expect(defaults.data).toBe("2024-06-15");
    expect(defaults.tipo).toBe("afastamento");
    expect(defaults.conteudo).toBe("Paciente necessita de afastamento.");
    expect(defaults.cid).toBe("J06.9");
    expect(defaults.dias_afastamento).toBe(3);
    expect(defaults.observacoes).toBe("Retorno em 5 dias");
  });
});
