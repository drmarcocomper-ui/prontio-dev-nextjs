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

vi.mock("@/components/delete-button", () => ({
  DeleteButton: ({ onDelete, title }: { onDelete: () => void; title: string }) => (
    <button data-testid="delete-button" data-title={title} onClick={onDelete}>Excluir</button>
  ),
}));

vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return { ...actual };
});

let mockProntuario: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockProntuario }),
          }),
        }),
      }),
    }),
}));

import ProntuarioDetalhesPage from "./page";

const prontuarioCompleto = {
  id: "pr-1",
  data: "2024-06-15",
  tipo: "consulta",
  cid: "J06.9",
  queixa_principal: "Dor de garganta há 3 dias",
  historia_doenca: "Paciente relata início há 3 dias",
  exame_fisico: "Orofaringe hiperemiada",
  hipotese_diagnostica: "IVAS",
  conduta: "Amoxicilina 500mg 8/8h por 7 dias",
  observacoes: "Retorno em 7 dias",
  created_at: "2024-06-15T10:30:00Z",
  updated_at: null,
  pacientes: { id: "p-1", nome: "Maria Silva" },
};

async function renderPage(id = "pr-1") {
  const jsx = await ProntuarioDetalhesPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("ProntuarioDetalhesPage", () => {
  beforeEach(() => {
    mockProntuario = prontuarioCompleto;
    mockNotFound.mockClear();
  });

  it("chama notFound quando prontuário não existe", async () => {
    mockProntuario = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o breadcrumb para prontuários", async () => {
    await renderPage();
    const link = screen.getByText("Prontuários").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios");
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

  it("exibe tipo e CID", async () => {
    await renderPage();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("CID: J06.9")).toBeInTheDocument();
  });

  it("renderiza o DeleteButton", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-title", "Excluir prontuário");
  });

  it("renderiza seções da evolução clínica", async () => {
    await renderPage();
    expect(screen.getByText("Evolução clínica")).toBeInTheDocument();
    expect(screen.getByText("Queixa principal")).toBeInTheDocument();
    expect(screen.getByText("Dor de garganta há 3 dias")).toBeInTheDocument();
    expect(screen.getByText("História da doença atual")).toBeInTheDocument();
    expect(screen.getByText("Paciente relata início há 3 dias")).toBeInTheDocument();
    expect(screen.getByText("Exame físico")).toBeInTheDocument();
    expect(screen.getByText("Orofaringe hiperemiada")).toBeInTheDocument();
    expect(screen.getByText("Hipótese diagnóstica")).toBeInTheDocument();
    expect(screen.getByText("IVAS")).toBeInTheDocument();
    expect(screen.getByText("Conduta")).toBeInTheDocument();
    expect(screen.getByText("Amoxicilina 500mg 8/8h por 7 dias")).toBeInTheDocument();
  });

  it("exibe mensagem quando não há informações", async () => {
    mockProntuario = {
      ...prontuarioCompleto,
      queixa_principal: null,
      historia_doenca: null,
      exame_fisico: null,
      hipotese_diagnostica: null,
      conduta: null,
      observacoes: null,
    };
    await renderPage();
    expect(screen.getByText("Nenhuma informação registrada.")).toBeInTheDocument();
  });

  it("exibe valor raw quando tipo não está em TIPO_LABELS", async () => {
    mockProntuario = { ...prontuarioCompleto, tipo: "tipo_desconhecido" };
    await renderPage();
    expect(screen.getByText("tipo_desconhecido")).toBeInTheDocument();
  });

  it("não exibe última atualização quando updated_at é null", async () => {
    await renderPage();
    expect(screen.getByText(/Registro criado em/)).toBeInTheDocument();
    expect(screen.queryByText(/Última atualização/)).not.toBeInTheDocument();
  });

  it("exibe última atualização quando updated_at está definido", async () => {
    mockProntuario = { ...prontuarioCompleto, updated_at: "2024-06-16T14:00:00Z" };
    await renderPage();
    expect(screen.getByText(/Última atualização em/)).toBeInTheDocument();
  });
});
