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

vi.mock("../status-badge", () => ({
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

vi.mock("@/components/delete-button", () => ({
  DeleteButton: ({ onDelete, title }: { onDelete: () => void; title: string }) => (
    <button data-testid="delete-button" data-title={title} onClick={onDelete}>Excluir</button>
  ),
}));

let mockAgendamento: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockAgendamento }),
          }),
        }),
      }),
    }),
}));

import AgendamentoDetalhesPage from "./page";

const agendamentoCompleto = {
  id: "ag-1",
  data: "2024-06-15",
  hora_inicio: "09:00:00",
  hora_fim: "09:30:00",
  tipo: "consulta",
  status: "agendado",
  observacoes: "Primeira consulta",
  created_at: "2024-06-15T08:00:00Z",
  pacientes: { id: "p-1", nome: "Maria Silva", telefone: "(11) 99999-0000" },
};

async function renderPage(id = "ag-1") {
  const jsx = await AgendamentoDetalhesPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("AgendamentoDetalhesPage", () => {
  beforeEach(() => {
    mockAgendamento = agendamentoCompleto;
    mockNotFound.mockClear();
  });

  it("chama notFound quando agendamento não existe", async () => {
    mockAgendamento = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o breadcrumb para agenda", async () => {
    await renderPage();
    const link = screen.getByText("Agenda").closest("a");
    expect(link).toHaveAttribute("href", "/agenda?data=2024-06-15");
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

  it("exibe tipo", async () => {
    await renderPage();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
  });

  it("exibe horário", async () => {
    await renderPage();
    expect(screen.getByText("09:00 — 09:30")).toBeInTheDocument();
  });

  it("renderiza o StatusBadge", async () => {
    await renderPage();
    expect(screen.getByTestId("status-badge")).toHaveTextContent("agendado");
  });

  it("renderiza o DeleteButton com props corretas", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-title", "Excluir agendamento");
  });

  it("exibe observações", async () => {
    await renderPage();
    expect(screen.getByText("Primeira consulta")).toBeInTheDocument();
  });

  it("exibe telefone do paciente", async () => {
    await renderPage();
    expect(screen.getByText("(11) 99999-0000")).toBeInTheDocument();
  });

  it("exibe link para editar", async () => {
    await renderPage();
    const link = screen.getByText("Editar").closest("a");
    expect(link).toHaveAttribute("href", "/agenda/ag-1/editar");
  });

  it("exibe valor raw quando tipo não está em TIPO_LABELS", async () => {
    mockAgendamento = { ...agendamentoCompleto, tipo: "tipo_desconhecido" };
    await renderPage();
    expect(screen.getByText("tipo_desconhecido")).toBeInTheDocument();
  });
});
