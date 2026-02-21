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

let mockAtestado: Record<string, unknown> | null = null;

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "doc-1" }),
}));

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

import AtestadoDetalhesPage from "./page";

const atestadoCompleto = {
  id: "at-1",
  data: "2024-06-15",
  tipo: "afastamento",
  conteudo: "Paciente necessita de afastamento por 3 dias devido a gripe.",
  cid: "J06.9",
  dias_afastamento: 3,
  observacoes: "Retorno em 5 dias",
  created_at: "2024-06-15T10:30:00Z",
  pacientes: { id: "p-1", nome: "Maria Silva" },
};

async function renderPage(id = "at-1") {
  const jsx = await AtestadoDetalhesPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("AtestadoDetalhesPage", () => {
  beforeEach(() => {
    mockAtestado = atestadoCompleto;
    mockNotFound.mockClear();
  });

  it("chama notFound quando atestado não existe", async () => {
    mockAtestado = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o breadcrumb para pacientes", async () => {
    await renderPage();
    const link = screen.getByText("Pacientes").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes");
    const pacienteLink = screen.getAllByText("Maria Silva").find((el) => el.closest("a")?.getAttribute("href") === "/pacientes/p-1");
    expect(pacienteLink).toBeTruthy();
    expect(screen.getByText("Atestado")).toBeInTheDocument();
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

  it("exibe tipo como badge", async () => {
    await renderPage();
    expect(screen.getByText("Afastamento")).toBeInTheDocument();
  });

  it("renderiza o DeleteButton", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-title", "Excluir atestado");
  });

  it("renderiza o conteúdo do atestado", async () => {
    await renderPage();
    expect(screen.getByText("Conteúdo do atestado")).toBeInTheDocument();
    expect(screen.getByText(/Paciente necessita de afastamento/)).toBeInTheDocument();
  });

  it("renderiza CID quando presente", async () => {
    await renderPage();
    expect(screen.getByText("CID")).toBeInTheDocument();
    expect(screen.getByText("J06.9")).toBeInTheDocument();
  });

  it("renderiza dias de afastamento quando presentes", async () => {
    await renderPage();
    expect(screen.getByText("Dias de afastamento")).toBeInTheDocument();
    expect(screen.getByText("3 dias")).toBeInTheDocument();
  });

  it("renderiza observações quando presentes", async () => {
    await renderPage();
    expect(screen.getByText("Observações")).toBeInTheDocument();
    expect(screen.getByText("Retorno em 5 dias")).toBeInTheDocument();
  });

  it("não renderiza observações quando ausentes", async () => {
    mockAtestado = { ...atestadoCompleto, observacoes: null };
    await renderPage();
    expect(screen.queryByText("Observações")).not.toBeInTheDocument();
  });

  it("não renderiza informações adicionais quando cid e dias_afastamento são nulos", async () => {
    mockAtestado = { ...atestadoCompleto, cid: null, dias_afastamento: null };
    await renderPage();
    expect(screen.queryByText("Informações adicionais")).not.toBeInTheDocument();
  });

  it("renderiza botão Imprimir com link correto", async () => {
    await renderPage();
    const link = screen.getByText("Imprimir").closest("a");
    expect(link).toHaveAttribute("href", "/atestados/at-1/imprimir");
  });

  it("renderiza botão Editar com link correto", async () => {
    await renderPage();
    const link = screen.getByText("Editar").closest("a");
    expect(link).toHaveAttribute("href", "/atestados/at-1/editar");
  });

  it("exibe tipo bruto quando não encontrado em TIPO_LABELS", async () => {
    mockAtestado = { ...atestadoCompleto, tipo: "desconhecido" };
    await renderPage();
    expect(screen.getByText("desconhecido")).toBeInTheDocument();
  });

  it("usa singular 'dia' quando dias_afastamento é 1", async () => {
    mockAtestado = { ...atestadoCompleto, dias_afastamento: 1 };
    await renderPage();
    expect(screen.getByText("1 dia")).toBeInTheDocument();
  });
});
