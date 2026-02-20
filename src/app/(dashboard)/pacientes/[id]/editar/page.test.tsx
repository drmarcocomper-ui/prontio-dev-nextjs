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

vi.mock("../../novo/paciente-form", () => ({
  PacienteForm: ({ defaults }: { defaults: Record<string, unknown> }) => (
    <form data-testid="paciente-form" data-defaults={JSON.stringify(defaults)} />
  ),
}));

let mockPaciente: Record<string, unknown> | null = null;

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1", clinicaNome: "Clínica Teste", papel: "profissional_saude", userId: "doc-1",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockPaciente }),
          }),
        }),
      }),
    }),
}));

import EditarPacientePage from "./page";

const pacienteMock = {
  id: "abc-123",
  nome: "Maria Silva",
  cpf: "12345678901",
  rg: "123456789",
  data_nascimento: "1990-05-15",
  sexo: "feminino",
  estado_civil: "casado",
  telefone: "11999998888",
  email: "maria@email.com",
  cep: "01001000",
  endereco: "Rua das Flores",
  numero: "100",
  complemento: "Apto 42",
  bairro: "Centro",
  cidade: "São Paulo",
  estado: "SP",
  convenio: "bradesco",
  observacoes: "Alergia a dipirona",
};

async function renderPage(id = "abc-123") {
  const jsx = await EditarPacientePage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarPacientePage", () => {
  beforeEach(() => {
    mockPaciente = pacienteMock;
    mockNotFound.mockClear();
  });

  it("chama notFound quando paciente não existe", async () => {
    mockPaciente = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar paciente", async () => {
    await renderPage();
    expect(screen.getByText("Editar paciente")).toBeInTheDocument();
  });

  it("renderiza o breadcrumb com nome do paciente", async () => {
    await renderPage();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/abc-123");
  });

  it("renderiza o PacienteForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("paciente-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.nome).toBe("Maria Silva");
    expect(defaults.id).toBe("abc-123");
  });
});
