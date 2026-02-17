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

const mockGetMedicoId = vi.fn().mockResolvedValue("doc-1");
vi.mock("@/lib/clinica", () => ({
  getMedicoId: (...args: unknown[]) => mockGetMedicoId(...args),
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "profissional_saude",
    userId: "user-1",
  }),
}));

vi.mock("../../novo/agendamento-form", () => ({
  AgendamentoForm: ({ defaults, medicoId }: { defaults: Record<string, unknown>; medicoId: string }) => (
    <form data-testid="agendamento-form" data-defaults={JSON.stringify(defaults)} data-medico-id={medicoId} />
  ),
}));

let mockAgendamento: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgendamento }),
            }),
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
  valor: 350,
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
    mockGetMedicoId.mockResolvedValue("doc-1");
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

  it("renderiza o breadcrumb para Agenda", async () => {
    await renderPage();
    const link = screen.getByText("Agenda").closest("a");
    expect(link).toHaveAttribute("href", "/agenda");
  });

  it("renderiza o breadcrumb com nome do paciente", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/agenda/ag-123");
  });

  it("renderiza o breadcrumb Editar sem link", async () => {
    await renderPage();
    const editar = screen.getByText("Editar");
    expect(editar.closest("a")).toBeNull();
  });

  it("renderiza o AgendamentoForm com defaults corretos", async () => {
    await renderPage();
    const form = screen.getByTestId("agendamento-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.id).toBe("ag-123");
    expect(defaults.paciente_id).toBe("pac-456");
    expect(defaults.paciente_nome).toBe("Maria Silva");
    expect(defaults.data).toBe("2024-06-15");
    expect(defaults.hora_inicio).toBe("09:00");
    expect(defaults.tipo).toBe("consulta");
    expect(defaults.observacoes).toBe("Obs teste");
  });

  it("passa medicoId para o AgendamentoForm", async () => {
    await renderPage();
    const form = screen.getByTestId("agendamento-form");
    expect(form).toHaveAttribute("data-medico-id", "doc-1");
  });

  it("chama notFound quando getMedicoId falha", async () => {
    mockGetMedicoId.mockRejectedValue(new Error("NO_MEDICO"));
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });
});
