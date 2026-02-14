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

vi.mock("./tabs", () => ({
  Tabs: ({ pacienteId }: { pacienteId: string }) => (
    <div data-testid="tabs" data-paciente-id={pacienteId} />
  ),
}));

vi.mock("@/components/delete-button", () => ({
  DeleteButton: ({ onDelete, title }: { onDelete: () => void; title: string }) => (
    <button data-testid="delete-button" data-title={title} onClick={onDelete}>
      Excluir
    </button>
  ),
}));

let mockPaciente: Record<string, unknown> | null = null;

let mockProntuarios: Record<string, unknown>[] = [];
let mockReceitas: Record<string, unknown>[] = [];

vi.mock("@/lib/clinica", async () => {
  const actual = await vi.importActual("@/lib/clinica");
  return {
    ...actual,
    getClinicaAtual: vi.fn().mockResolvedValue({
      clinicaId: "clinic-1",
      clinicaNome: "Clínica Teste",
      papel: "profissional_saude",
      userId: "user-1",
    }),
    getMedicoId: vi.fn().mockResolvedValue("user-1"),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => ({
        select: () => ({
          eq: () => {
            if (table === "pacientes") {
              return {
                eq: () => ({
                  single: () => Promise.resolve({ data: mockPaciente }),
                }),
              };
            }
            if (table === "receitas") {
              return {
                order: () => Promise.resolve({ data: mockReceitas }),
              };
            }
            return {
              order: () => ({
                limit: () => Promise.resolve({ data: mockProntuarios, count: mockProntuarios.length }),
              }),
            };
          },
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

async function renderPage(id = "abc-123", searchParams: { tab?: string } = {}) {
  const jsx = await PacienteDetalhesPage({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve(searchParams),
  });
  return render(jsx);
}

describe("PacienteDetalhesPage", () => {
  beforeEach(() => {
    mockPaciente = pacienteCompleto;
    mockProntuarios = [];
    mockReceitas = [];
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
    expect(screen.getByRole("heading", { name: "Maria Silva Santos" })).toBeInTheDocument();
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

  it("renderiza o DeleteButton", async () => {
    await renderPage();
    const btn = screen.getByTestId("delete-button");
    expect(btn).toHaveAttribute("data-title", "Excluir paciente");
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

  it("formata telefone fixo com 10 dígitos", async () => {
    mockPaciente = { ...pacienteCompleto, telefone: "1133334444" };
    await renderPage();
    expect(screen.getByText("(11) 3333-4444")).toBeInTheDocument();
  });

  it("exibe telefone sem formatação quando formato desconhecido", async () => {
    mockPaciente = { ...pacienteCompleto, telefone: "123" };
    await renderPage();
    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("exibe empty state de evoluções quando não há prontuários", async () => {
    mockProntuarios = [];
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("Nenhuma evolução registrada.")).toBeInTheDocument();
  });

  it("renderiza lista de prontuários quando existem", async () => {
    mockProntuarios = [
      { id: "pr-1", data: "2024-06-15", tipo: "consulta", cid: "J06.9", queixa_principal: "Dor de garganta" },
      { id: "pr-2", data: "2024-06-10", tipo: null, cid: null, queixa_principal: null },
    ];
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("CID: J06.9")).toBeInTheDocument();
    expect(screen.getByText("Dor de garganta")).toBeInTheDocument();
    const link = screen.getByText("Dor de garganta").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios/pr-1?from=paciente");
  });

  it("renderiza link Nova evolução com paciente_id", async () => {
    await renderPage("abc-123", { tab: "prontuario" });
    const link = screen.getByText("Nova evolução").closest("a");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("paciente_id=abc-123")
    );
  });

  it("exibe empty state de receitas quando não há receitas", async () => {
    mockReceitas = [];
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("Nenhuma receita emitida.")).toBeInTheDocument();
  });

  it("renderiza lista de receitas quando existem", async () => {
    mockReceitas = [
      { id: "rec-1", data: "2024-06-15", tipo: "simples", medicamentos: "Amoxicilina 500mg" },
      { id: "rec-2", data: "2024-06-10", tipo: "controle_especial", medicamentos: "Ritalina 10mg" },
    ];
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    expect(screen.getByText("Ritalina 10mg")).toBeInTheDocument();
    expect(screen.getByText("Simples")).toBeInTheDocument();
    expect(screen.getByText("Controle Especial")).toBeInTheDocument();
    const link = screen.getByText("Amoxicilina 500mg").closest("a");
    expect(link).toHaveAttribute("href", "/receitas/rec-1");
  });

  it("renderiza link Nova receita com paciente_id", async () => {
    await renderPage("abc-123", { tab: "prontuario" });
    const link = screen.getByText("Nova receita").closest("a");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("paciente_id=abc-123")
    );
  });

  it("renderiza seção Receitas médicas", async () => {
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("Receitas médicas")).toBeInTheDocument();
  });

  it("renderiza seção Evoluções clínicas", async () => {
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("Evoluções clínicas")).toBeInTheDocument();
  });

  it("exibe valor raw quando sexo não está em SEXO_LABELS", async () => {
    mockPaciente = { ...pacienteCompleto, sexo: "outro_sexo" };
    await renderPage();
    const elements = screen.getAllByText("outro_sexo");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("exibe valor raw quando estado_civil não está em ESTADO_CIVIL_LABELS", async () => {
    mockPaciente = { ...pacienteCompleto, estado_civil: "outro_estado" };
    await renderPage();
    expect(screen.getByText("outro_estado")).toBeInTheDocument();
  });

  it("exibe valor raw quando tipo do prontuário não está em TIPO_LABELS", async () => {
    mockProntuarios = [
      { id: "pr-x", data: "2024-06-15", tipo: "tipo_desconhecido", cid: null, queixa_principal: null },
    ];
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("tipo_desconhecido")).toBeInTheDocument();
  });

  it("calcula idade corretamente quando aniversário é no mês atual mas depois de hoje", async () => {
    const today = new Date();
    const futureDay = Math.min(today.getDate() + 10, 28);
    const birthDate = `1990-${String(today.getMonth() + 1).padStart(2, "0")}-${String(futureDay).padStart(2, "0")}`;
    mockPaciente = { ...pacienteCompleto, data_nascimento: birthDate };
    await renderPage();
    const expectedAge = today.getFullYear() - 1990 - 1;
    const matches = screen.getAllByText(new RegExp(`${expectedAge} anos`));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("calcula idade corretamente quando aniversário já passou no mês atual", async () => {
    const today = new Date();
    const pastDay = Math.max(today.getDate() - 5, 1);
    const birthDate = `1990-${String(today.getMonth() + 1).padStart(2, "0")}-${String(pastDay).padStart(2, "0")}`;
    mockPaciente = { ...pacienteCompleto, data_nascimento: birthDate };
    await renderPage();
    const expectedAge = today.getFullYear() - 1990;
    const matches = screen.getAllByText(new RegExp(`${expectedAge} anos`));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("exibe valor raw quando tipo da receita não está em RECEITA_TIPO_LABELS", async () => {
    mockReceitas = [
      { id: "rec-x", data: "2024-06-15", tipo: "tipo_desconhecido", medicamentos: "Med X" },
    ];
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("tipo_desconhecido")).toBeInTheDocument();
  });

  it("renderiza o componente Tabs com pacienteId", async () => {
    await renderPage();
    const tabs = screen.getByTestId("tabs");
    expect(tabs).toHaveAttribute("data-paciente-id", "abc-123");
  });

  it("exibe aba identificacao por padrão", async () => {
    await renderPage();
    expect(screen.getByText("Dados pessoais")).toBeInTheDocument();
    expect(screen.queryByText("Evoluções clínicas")).not.toBeInTheDocument();
  });

  it("aba prontuario mostra evoluções e receitas", async () => {
    await renderPage("abc-123", { tab: "prontuario" });
    expect(screen.getByText("Evoluções clínicas")).toBeInTheDocument();
    expect(screen.getByText("Receitas médicas")).toBeInTheDocument();
    expect(screen.queryByText("Dados pessoais")).not.toBeInTheDocument();
  });

  it("aba identificacao não mostra conteúdo de prontuário", async () => {
    await renderPage("abc-123", { tab: "identificacao" });
    expect(screen.getByText("Dados pessoais")).toBeInTheDocument();
    expect(screen.queryByText("Evoluções clínicas")).not.toBeInTheDocument();
    expect(screen.queryByText("Receitas médicas")).not.toBeInTheDocument();
  });
});
