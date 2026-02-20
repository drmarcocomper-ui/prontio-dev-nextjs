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

vi.mock("../../novo/exame-form", () => ({
  ExameForm: ({ defaults }: { defaults: Record<string, unknown> }) => (
    <form data-testid="exame-form" data-defaults={JSON.stringify(defaults)} />
  ),
}));

let mockExame: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockExame }),
          }),
        }),
      }),
    }),
}));

import EditarExamePage from "./page";

const exameMock = {
  id: "ex-123",
  data: "2024-06-15",
  exames: "- Hemograma Completo (TUSS: 40304361)",
  indicacao_clinica: "Check-up anual",
  observacoes: "Jejum de 12 horas",
  pacientes: {
    id: "pac-456",
    nome: "Maria Silva",
  },
};

async function renderPage(id = "ex-123") {
  const jsx = await EditarExamePage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarExamePage", () => {
  beforeEach(() => {
    mockExame = exameMock;
    mockNotFound.mockClear();
  });

  it("chama notFound quando exame não existe", async () => {
    mockExame = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar solicitação de exame", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Editar solicitação de exame" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para o paciente", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/pac-456");
  });

  it("renderiza o ExameForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("exame-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.id).toBe("ex-123");
    expect(defaults.paciente_id).toBe("pac-456");
    expect(defaults.paciente_nome).toBe("Maria Silva");
    expect(defaults.data).toBe("2024-06-15");
    expect(defaults.exames).toBe("- Hemograma Completo (TUSS: 40304361)");
    expect(defaults.indicacao_clinica).toBe("Check-up anual");
    expect(defaults.observacoes).toBe("Jejum de 12 horas");
  });
});
