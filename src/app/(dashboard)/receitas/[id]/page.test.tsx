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

vi.mock("./delete-button", () => ({
  DeleteButton: ({ receitaId }: { receitaId: string }) => (
    <button data-testid="delete-button" data-id={receitaId}>Excluir</button>
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

import ReceitaDetalhesPage from "./page";

const receitaCompleta = {
  id: "rec-1",
  data: "2024-06-15",
  tipo: "simples",
  medicamentos: "Amoxicilina 500mg 8/8h por 7 dias\nIbuprofeno 400mg 6/6h se dor",
  observacoes: "Retorno em 7 dias",
  created_at: "2024-06-15T10:30:00Z",
  pacientes: { id: "p-1", nome: "Maria Silva" },
};

async function renderPage(id = "rec-1") {
  const jsx = await ReceitaDetalhesPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("ReceitaDetalhesPage", () => {
  beforeEach(() => {
    mockReceita = receitaCompleta;
    mockNotFound.mockClear();
  });

  it("chama notFound quando receita não existe", async () => {
    mockReceita = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o breadcrumb para receitas", async () => {
    await renderPage();
    const link = screen.getByText("Receitas").closest("a");
    expect(link).toHaveAttribute("href", "/receitas");
  });

  it("renderiza o nome do paciente com link", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/p-1");
  });

  it("renderiza as iniciais do paciente", async () => {
    await renderPage();
    expect(screen.getByText("MS")).toBeInTheDocument();
  });

  it("exibe tipo como badge", async () => {
    await renderPage();
    expect(screen.getByText("Simples")).toBeInTheDocument();
  });

  it("renderiza o DeleteButton", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-id", "rec-1");
  });

  it("renderiza os medicamentos", async () => {
    await renderPage();
    expect(screen.getByText("Medicamentos")).toBeInTheDocument();
    expect(screen.getByText(/Amoxicilina 500mg/)).toBeInTheDocument();
  });

  it("renderiza observações quando presentes", async () => {
    await renderPage();
    expect(screen.getByText("Observações")).toBeInTheDocument();
    expect(screen.getByText("Retorno em 7 dias")).toBeInTheDocument();
  });

  it("não renderiza observações quando ausentes", async () => {
    mockReceita = { ...receitaCompleta, observacoes: null };
    await renderPage();
    expect(screen.queryByText("Observações")).not.toBeInTheDocument();
  });

  it("renderiza botão Imprimir com link correto", async () => {
    await renderPage();
    const link = screen.getByText("Imprimir").closest("a");
    expect(link).toHaveAttribute("href", "/receitas/rec-1/imprimir");
  });

  it("renderiza botão Editar com link correto", async () => {
    await renderPage();
    const link = screen.getByText("Editar").closest("a");
    expect(link).toHaveAttribute("href", "/receitas/rec-1/editar");
  });
});
