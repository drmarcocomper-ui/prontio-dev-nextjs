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

vi.mock("../../types", async () => {
  const actual = await vi.importActual("../../types");
  return { ...actual };
});

vi.mock("@/lib/clinica", () => ({ getMedicoId: vi.fn().mockResolvedValue("doc-1") }));

vi.mock("../../novo/prontuario-form", () => ({
  ProntuarioForm: ({ defaults }: { defaults: Record<string, unknown> }) => (
    <form data-testid="prontuario-form" data-defaults={JSON.stringify(defaults)} />
  ),
}));

let mockProntuario: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockProntuario }),
            }),
          }),
        }),
      }),
    }),
}));

import EditarProntuarioPage from "./page";

const prontuarioMock = {
  id: "pr-123",
  data: "2024-06-15",
  tipo: "consulta",
  cid: "J06.9",
  queixa_principal: "Dor de cabeça",
  historia_doenca: "Início há 3 dias",
  exame_fisico: "PA 120x80",
  hipotese_diagnostica: "Cefaleia tensional",
  conduta: "Analgésico",
  observacoes: "Retorno em 7 dias",
  pacientes: {
    id: "pac-456",
    nome: "Maria Silva",
  },
};

async function renderPage(id = "pr-123") {
  const jsx = await EditarProntuarioPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarProntuarioPage", () => {
  beforeEach(() => {
    mockProntuario = prontuarioMock;
    mockNotFound.mockClear();
  });

  it("chama notFound quando prontuário não existe", async () => {
    mockProntuario = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar evolução", async () => {
    await renderPage();
    expect(screen.getByText("Editar evolução")).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para o prontuário", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios/pr-123");
  });

  it("renderiza o ProntuarioForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("prontuario-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.id).toBe("pr-123");
    expect(defaults.paciente_id).toBe("pac-456");
    expect(defaults.paciente_nome).toBe("Maria Silva");
    expect(defaults.data).toBe("2024-06-15");
    expect(defaults.tipo).toBe("consulta");
    expect(defaults.cid).toBe("J06.9");
    expect(defaults.queixa_principal).toBe("Dor de cabeça");
    expect(defaults.conduta).toBe("Analgésico");
  });
});
