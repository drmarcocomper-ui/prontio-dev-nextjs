import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExame = {
  id: "00000000-0000-0000-0000-000000000001",
  data: "2024-06-15",
  exames: "Hemograma completo\nGlicemia em jejum",
  indicacao_clinica: "Check-up",
  observacoes: null,
  pacientes: {
    id: "00000000-0000-0000-0000-000000000002",
    nome: "Maria Silva",
    cpf: "12345678901",
    convenio: "particular",
  },
};

let currentExame: typeof mockExame | null = mockExame;

const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === "solicitacoes_exames") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: currentExame }),
                }),
              }),
            }),
          };
        }
        if (table === "clinicas") {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      nome: "Clínica Teste",
                      endereco: "Rua A, 123",
                      telefone: "11999999999",
                    },
                  }),
              }),
            }),
          };
        }
        // configuracoes
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [
                  { chave: "nome_profissional", valor: "Dr. João" },
                  { chave: "especialidade", valor: "Clínica Geral" },
                  { chave: "crm", valor: "12345-SP" },
                ],
              }),
          }),
        };
      },
    }),
}));

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: ({ items }: { items: { label: string; href?: string }[] }) => (
    <nav data-testid="breadcrumb">
      {items.map((item, i) =>
        item.href ? (
          <a key={i} href={item.href}>
            {item.label}
          </a>
        ) : (
          <span key={i}>{item.label}</span>
        ),
      )}
    </nav>
  ),
}));

vi.mock("@/lib/clinica", () => ({
  getMedicoId: vi.fn().mockResolvedValue("user-1"),
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "c-1",
    clinicaNome: "Clínica Teste",
    papel: "superadmin",
    userId: "u-1",
  }),
}));

vi.mock("@/lib/validators", () => ({
  UUID_RE:
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
}));

vi.mock("./print-button", () => ({
  PrintActions: (props: Record<string, unknown>) => (
    <div
      data-testid="print-actions"
      data-formato={String(props.defaultFormato ?? "")}
    />
  ),
}));

vi.mock("../../types", async () => {
  const actual = await vi.importActual("../../types");
  return {
    ...actual,
    formatDateMedium: (d: string) => d,
    formatCPF: (cpf: string) => cpf,
  };
});

vi.mock("@/app/(dashboard)/pacientes/types", () => ({
  CONVENIO_LABELS: {
    particular: "Particular",
    amil: "Amil",
  },
}));

import ImprimirExamePage from "./page";

const VALID_UUID = "00000000-0000-0000-0000-000000000001";

async function renderPage(
  id = VALID_UUID,
  searchParams: {
    formato?: string;
    operadora?: string;
    carteirinha?: string;
    registro_ans?: string;
  } = {},
) {
  const jsx = await ImprimirExamePage({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve(searchParams),
  });
  return render(jsx);
}

describe("ImprimirExamePage", () => {
  beforeEach(() => {
    currentExame = mockExame;
    mockNotFound.mockClear();
  });

  it("chama notFound quando id é UUID inválido", async () => {
    await expect(renderPage("invalid-id")).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("chama notFound quando exame não é encontrado", async () => {
    currentExame = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza nome do paciente quando dados são válidos", async () => {
    await renderPage();
    const elements = screen.getAllByText("Maria Silva");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("usa formato particular como padrão quando formato não é especificado", async () => {
    await renderPage(VALID_UUID, {});
    const printActions = screen.getByTestId("print-actions");
    expect(printActions).toHaveAttribute("data-formato", "particular");
  });

  it("usa formato sadt quando formato=sadt", async () => {
    await renderPage(VALID_UUID, { formato: "sadt" });
    const printActions = screen.getByTestId("print-actions");
    expect(printActions).toHaveAttribute("data-formato", "sadt");
    expect(screen.getByText("GUIA DE SP/SADT")).toBeInTheDocument();
  });
});
