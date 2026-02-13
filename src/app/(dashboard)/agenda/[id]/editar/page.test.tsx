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
  getMedicoId: vi.fn().mockResolvedValue("doc-1"),
}));

vi.mock("../../novo/agendamento-form", () => ({
  AgendamentoForm: ({ defaults }: { defaults: Record<string, unknown> }) => (
    <form data-testid="agendamento-form" data-defaults={JSON.stringify(defaults)} />
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

import EditarAgendamentoPage from "./page";

const agendamentoMock = {
  id: "ag-123",
  data: "2024-06-15",
  hora_inicio: "09:00:00",
  hora_fim: "09:30:00",
  tipo: "consulta",
  observacoes: "Obs teste",
  pacientes: {
    id: "pac-456",
    nome: "Maria Silva",
  },
};

async function renderPage(id = "ag-123") {
  const jsx = await EditarAgendamentoPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarAgendamentoPage", () => {
  beforeEach(() => {
    mockAgendamento = agendamentoMock;
    mockNotFound.mockClear();
  });

  it("chama notFound quando agendamento não existe", async () => {
    mockAgendamento = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar agendamento", async () => {
    await renderPage();
    expect(screen.getByText("Editar agendamento")).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para o agendamento", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/agenda/ag-123");
  });

  it("renderiza o AgendamentoForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("agendamento-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.id).toBe("ag-123");
    expect(defaults.paciente_id).toBe("pac-456");
    expect(defaults.paciente_nome).toBe("Maria Silva");
    expect(defaults.data).toBe("2024-06-15");
    expect(defaults.hora_inicio).toBe("09:00");
    expect(defaults.hora_fim).toBe("09:30");
    expect(defaults.tipo).toBe("consulta");
    expect(defaults.observacoes).toBe("Obs teste");
  });
});
