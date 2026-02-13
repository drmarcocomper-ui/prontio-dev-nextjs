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

vi.mock("../../novo/receita-form", () => ({
  ReceitaForm: ({ defaults }: { defaults: Record<string, unknown> }) => (
    <form data-testid="receita-form" data-defaults={JSON.stringify(defaults)} />
  ),
}));

let mockReceita: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockReceita }),
          }),
        }),
      }),
    }),
}));

import EditarReceitaPage from "./page";

const receitaMock = {
  id: "rec-123",
  data: "2024-06-15",
  tipo: "especial",
  medicamentos: "Ritalina 10mg 1x ao dia",
  observacoes: "Uso contínuo",
  pacientes: {
    id: "pac-456",
    nome: "Maria Silva",
  },
};

async function renderPage(id = "rec-123") {
  const jsx = await EditarReceitaPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarReceitaPage", () => {
  beforeEach(() => {
    mockReceita = receitaMock;
    mockNotFound.mockClear();
  });

  it("chama notFound quando receita não existe", async () => {
    mockReceita = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar receita", async () => {
    await renderPage();
    expect(screen.getByText("Editar receita")).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para a receita", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/receitas/rec-123");
  });

  it("renderiza o ReceitaForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("receita-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.id).toBe("rec-123");
    expect(defaults.paciente_id).toBe("pac-456");
    expect(defaults.paciente_nome).toBe("Maria Silva");
    expect(defaults.data).toBe("2024-06-15");
    expect(defaults.tipo).toBe("especial");
    expect(defaults.medicamentos).toBe("Ritalina 10mg 1x ao dia");
    expect(defaults.observacoes).toBe("Uso contínuo");
  });
});
