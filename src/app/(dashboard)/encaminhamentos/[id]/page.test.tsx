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

let mockEncaminhamento: Record<string, unknown> | null = null;

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "doc-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockEncaminhamento }),
          }),
        }),
      }),
    }),
}));

import EncaminhamentoDetalhesPage from "./page";

const encaminhamentoCompleto = {
  id: "enc-1",
  data: "2024-06-15",
  profissional_destino: "Dr. João Cardiologista",
  especialidade: "Cardiologia",
  telefone_profissional: "11999998888",
  motivo: "Paciente apresenta sopro cardíaco.",
  observacoes: "Urgente",
  created_at: "2024-06-15T10:30:00Z",
  pacientes: { id: "p-1", nome: "Maria Silva" },
};

async function renderPage(id = "enc-1") {
  const jsx = await EncaminhamentoDetalhesPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EncaminhamentoDetalhesPage", () => {
  beforeEach(() => {
    mockEncaminhamento = encaminhamentoCompleto;
    mockNotFound.mockClear();
  });

  it("chama notFound quando encaminhamento não existe", async () => {
    mockEncaminhamento = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o breadcrumb para pacientes", async () => {
    await renderPage();
    const link = screen.getByText("Pacientes").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes");
    const pacienteLink = screen.getAllByText("Maria Silva").find((el) => el.closest("a")?.getAttribute("href") === "/pacientes/p-1");
    expect(pacienteLink).toBeTruthy();
    expect(screen.getByText("Encaminhamento")).toBeInTheDocument();
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

  it("exibe especialidade como badge", async () => {
    await renderPage();
    expect(screen.getAllByText("Cardiologia").length).toBeGreaterThan(0);
  });

  it("renderiza o DeleteButton", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-title", "Excluir encaminhamento");
  });

  it("renderiza o profissional de destino", async () => {
    await renderPage();
    expect(screen.getByText("Profissional de destino")).toBeInTheDocument();
    expect(screen.getByText("Dr. João Cardiologista")).toBeInTheDocument();
  });

  it("renderiza o telefone quando presente", async () => {
    await renderPage();
    expect(screen.getByText("Telefone")).toBeInTheDocument();
  });

  it("não renderiza o telefone quando ausente", async () => {
    mockEncaminhamento = { ...encaminhamentoCompleto, telefone_profissional: null };
    await renderPage();
    expect(screen.queryByText("Telefone")).not.toBeInTheDocument();
  });

  it("renderiza o motivo do encaminhamento", async () => {
    await renderPage();
    expect(screen.getByText("Motivo do encaminhamento")).toBeInTheDocument();
    expect(screen.getByText("Paciente apresenta sopro cardíaco.")).toBeInTheDocument();
  });

  it("renderiza observações quando presentes", async () => {
    await renderPage();
    expect(screen.getByText("Observações")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("não renderiza observações quando ausentes", async () => {
    mockEncaminhamento = { ...encaminhamentoCompleto, observacoes: null };
    await renderPage();
    expect(screen.queryByText("Observações")).not.toBeInTheDocument();
  });

  it("renderiza botão Imprimir com link correto", async () => {
    await renderPage();
    const link = screen.getByText("Imprimir").closest("a");
    expect(link).toHaveAttribute("href", "/encaminhamentos/enc-1/imprimir");
  });

  it("renderiza botão Editar com link correto", async () => {
    await renderPage();
    const link = screen.getByText("Editar").closest("a");
    expect(link).toHaveAttribute("href", "/encaminhamentos/enc-1/editar");
  });
});
