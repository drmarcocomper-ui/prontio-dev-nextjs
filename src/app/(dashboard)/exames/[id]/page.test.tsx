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

vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return { ...actual };
});

vi.mock("@/components/delete-button", () => ({
  DeleteButton: ({ onDelete, title }: { onDelete: () => void; title: string }) => (
    <button data-testid="delete-button" data-title={title} onClick={onDelete}>Excluir</button>
  ),
}));

let mockExame: Record<string, unknown> | null = null;

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "doc-1" }),
}));

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

import ExameDetalhesPage from "./page";

const exameCompleto = {
  id: "ex-1",
  data: "2024-06-15",
  exames: "- Hemograma Completo (TUSS: 40304361)\n- Glicemia de Jejum",
  indicacao_clinica: "Check-up anual",
  observacoes: "Jejum de 12 horas",
  created_at: "2024-06-15T10:30:00Z",
  pacientes: { id: "p-1", nome: "Maria Silva" },
};

async function renderPage(id = "ex-1") {
  const jsx = await ExameDetalhesPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("ExameDetalhesPage", () => {
  beforeEach(() => {
    mockExame = exameCompleto;
    mockNotFound.mockClear();
  });

  it("chama notFound quando exame não existe", async () => {
    mockExame = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o breadcrumb para pacientes", async () => {
    await renderPage();
    const link = screen.getByText("Pacientes").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes");
    const pacienteLink = screen.getAllByText("Maria Silva").find((el) => el.closest("a")?.getAttribute("href") === "/pacientes/p-1");
    expect(pacienteLink).toBeTruthy();
    expect(screen.getByText("Solicitação de exame")).toBeInTheDocument();
  });

  it("renderiza o nome do paciente com link", async () => {
    await renderPage();
    const elements = screen.getAllByText("Maria Silva");
    const link = elements.find((el) => el.closest("a")?.getAttribute("href") === "/pacientes/p-1");
    expect(link).toBeTruthy();
  });

  it("renderiza as iniciais do paciente", async () => {
    await renderPage();
    expect(screen.getByText("MS")).toBeInTheDocument();
  });

  it("renderiza o DeleteButton", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-title", "Excluir solicitação");
  });

  it("renderiza os exames solicitados", async () => {
    await renderPage();
    expect(screen.getByText("Exames solicitados")).toBeInTheDocument();
    expect(screen.getByText(/Hemograma Completo/)).toBeInTheDocument();
  });

  it("renderiza indicação clínica quando presente", async () => {
    await renderPage();
    expect(screen.getByText("Indicação clínica")).toBeInTheDocument();
    expect(screen.getByText("Check-up anual")).toBeInTheDocument();
  });

  it("não renderiza indicação clínica quando ausente", async () => {
    mockExame = { ...exameCompleto, indicacao_clinica: null };
    await renderPage();
    expect(screen.queryByText("Indicação clínica")).not.toBeInTheDocument();
  });

  it("renderiza observações quando presentes", async () => {
    await renderPage();
    expect(screen.getByText("Observações")).toBeInTheDocument();
    expect(screen.getByText("Jejum de 12 horas")).toBeInTheDocument();
  });

  it("não renderiza observações quando ausentes", async () => {
    mockExame = { ...exameCompleto, observacoes: null };
    await renderPage();
    expect(screen.queryByText("Observações")).not.toBeInTheDocument();
  });

  it("renderiza botão Imprimir com link correto", async () => {
    await renderPage();
    const link = screen.getByText("Imprimir").closest("a");
    expect(link).toHaveAttribute("href", "/exames/ex-1/imprimir");
  });

  it("renderiza botão Editar com link correto", async () => {
    await renderPage();
    const link = screen.getByText("Editar").closest("a");
    expect(link).toHaveAttribute("href", "/exames/ex-1/editar");
  });
});
