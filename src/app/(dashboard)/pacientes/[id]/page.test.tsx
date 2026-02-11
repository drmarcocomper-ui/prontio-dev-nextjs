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
  DeleteButton: ({ pacienteId }: { pacienteId: string }) => (
    <button data-testid="delete-button" data-id={pacienteId}>
      Excluir
    </button>
  ),
}));

let mockPaciente: Record<string, unknown> | null = null;

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

import PacienteDetalhesPage from "./page";

const pacienteCompleto = {
  id: "abc-123",
  nome: "Maria Silva Santos",
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
  convenio: "Unimed",
  observacoes: "Alergia a dipirona",
  created_at: "2024-06-15T10:30:00Z",
};

const pacienteMinimo = {
  id: "def-456",
  nome: "João Santos",
  cpf: null,
  rg: null,
  data_nascimento: null,
  sexo: null,
  estado_civil: null,
  telefone: null,
  email: null,
  cep: null,
  endereco: null,
  numero: null,
  complemento: null,
  bairro: null,
  cidade: null,
  estado: null,
  convenio: null,
  observacoes: null,
  created_at: "2024-01-01T00:00:00Z",
};

async function renderPage(id = "abc-123") {
  const jsx = await PacienteDetalhesPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("PacienteDetalhesPage", () => {
  beforeEach(() => {
    mockPaciente = pacienteCompleto;
    mockNotFound.mockClear();
  });

  it("chama notFound quando paciente não existe", async () => {
    mockPaciente = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o breadcrumb para pacientes", async () => {
    await renderPage();
    const link = screen.getByText("Pacientes").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes");
  });

  it("renderiza o nome do paciente", async () => {
    await renderPage();
    expect(screen.getByText("Maria Silva Santos")).toBeInTheDocument();
  });

  it("renderiza as iniciais do paciente", async () => {
    await renderPage();
    expect(screen.getByText("MS")).toBeInTheDocument();
  });

  it("renderiza o link de editar com href correto", async () => {
    await renderPage();
    const link = screen.getByText("Editar").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/abc-123/editar");
  });

  it("renderiza o DeleteButton com pacienteId", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-id", "abc-123");
  });

  it("formata e exibe o CPF", async () => {
    await renderPage();
    expect(screen.getByText("123.456.789-01")).toBeInTheDocument();
  });

  it("exibe o RG", async () => {
    await renderPage();
    expect(screen.getByText("123456789")).toBeInTheDocument();
  });

  it("formata e exibe o telefone", async () => {
    await renderPage();
    expect(screen.getByText("(11) 99999-8888")).toBeInTheDocument();
  });

  it("exibe o email", async () => {
    await renderPage();
    expect(screen.getByText("maria@email.com")).toBeInTheDocument();
  });

  it("exibe o sexo com label correto", async () => {
    await renderPage();
    const elements = screen.getAllByText("Feminino");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("exibe o estado civil com label correto", async () => {
    await renderPage();
    expect(screen.getByText("Casado(a)")).toBeInTheDocument();
  });

  it("exibe o endereço completo", async () => {
    await renderPage();
    expect(screen.getByText("Rua das Flores, nº 100, Apto 42")).toBeInTheDocument();
  });

  it("exibe bairro, cidade/UF e CEP formatado", async () => {
    await renderPage();
    expect(screen.getByText("Centro")).toBeInTheDocument();
    expect(screen.getByText("São Paulo - SP")).toBeInTheDocument();
    expect(screen.getByText("01001-000")).toBeInTheDocument();
  });

  it("exibe convênio como badge", async () => {
    await renderPage();
    const elements = screen.getAllByText("Unimed");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("exibe observações", async () => {
    await renderPage();
    expect(screen.getByText("Alergia a dipirona")).toBeInTheDocument();
  });

  it("exibe seções de informação", async () => {
    await renderPage();
    expect(screen.getByText("Dados pessoais")).toBeInTheDocument();
    expect(screen.getByText("Contato")).toBeInTheDocument();
    expect(screen.getByText("Endereço")).toBeInTheDocument();
    expect(screen.getByText("Informações adicionais")).toBeInTheDocument();
  });

  it("exibe traço para campos nulos", async () => {
    mockPaciente = pacienteMinimo;
    await renderPage("def-456");
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(5);
  });
});
