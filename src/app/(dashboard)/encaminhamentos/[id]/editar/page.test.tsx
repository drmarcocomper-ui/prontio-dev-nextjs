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
  getClinicaAtual: vi.fn().mockResolvedValue({ clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "doc-1" }),
}));

vi.mock("../../novo/encaminhamento-form", () => ({
  EncaminhamentoForm: ({ defaults }: { defaults: Record<string, unknown> }) => (
    <form data-testid="encaminhamento-form" data-defaults={JSON.stringify(defaults)} />
  ),
}));

let mockEncaminhamento: Record<string, unknown> | null = null;

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

import EditarEncaminhamentoPage from "./page";

const encaminhamentoMock = {
  id: "enc-123",
  data: "2024-06-15",
  profissional_destino: "Dr. João Cardiologista",
  especialidade: "Cardiologia",
  telefone_profissional: "11999998888",
  motivo: "Sopro cardíaco",
  observacoes: "Urgente",
  pacientes: {
    id: "pac-456",
    nome: "Maria Silva",
  },
};

async function renderPage(id = "enc-123") {
  const jsx = await EditarEncaminhamentoPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarEncaminhamentoPage", () => {
  beforeEach(() => {
    mockEncaminhamento = encaminhamentoMock;
    mockNotFound.mockClear();
  });

  it("chama notFound quando encaminhamento não existe", async () => {
    mockEncaminhamento = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar encaminhamento", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Editar encaminhamento" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para o paciente", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/pac-456");
  });

  it("renderiza o EncaminhamentoForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("encaminhamento-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.id).toBe("enc-123");
    expect(defaults.paciente_id).toBe("pac-456");
    expect(defaults.paciente_nome).toBe("Maria Silva");
    expect(defaults.data).toBe("2024-06-15");
    expect(defaults.profissional_destino).toBe("Dr. João Cardiologista");
    expect(defaults.especialidade).toBe("Cardiologia");
    expect(defaults.telefone_profissional).toBe("11999998888");
    expect(defaults.motivo).toBe("Sopro cardíaco");
    expect(defaults.observacoes).toBe("Urgente");
  });
});
