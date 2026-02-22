import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReceita = vi.hoisted(() => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  data: "2024-06-15",
  tipo: "simples" as string,
  medicamentos: "Amoxicilina 500mg",
  observacoes: "Tomar com água",
  pacientes: { id: "p-1", nome: "Maria Silva", cpf: "52998224725" },
}));

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
        if (table === "receitas") {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockReceita }),
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
                      endereco: "Rua A",
                      telefone: "11999",
                    },
                  }),
              }),
            }),
          };
        }
        // configuracoes
        return {
          select: () => ({
            eq: () => ({
              in: () =>
                Promise.resolve({
                  data: [
                    { chave: "nome_profissional", valor: "Dr. João" },
                    { chave: "especialidade", valor: "Cardiologia" },
                    { chave: "crm", valor: "12345-SP" },
                  ],
                }),
            }),
          }),
        };
      },
    }),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi
    .fn()
    .mockResolvedValue({
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

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb" />,
}));

vi.mock("./print-button", () => ({
  PrintButton: () => <button data-testid="print-button">Imprimir</button>,
}));

vi.mock("../../types", async () => {
  const actual = await vi.importActual("../../types");
  return {
    ...actual,
    TIPO_LABELS_IMPRESSAO: {
      simples: "Receita Simples",
      controle_especial: "Receita de Controle Especial",
    },
    formatDateMedium: (d: string) => d,
    formatCPF: (cpf: string) => cpf,
  };
});

import ImprimirReceitaPage from "./page";

async function renderPage(id = "550e8400-e29b-41d4-a716-446655440000") {
  const jsx = await ImprimirReceitaPage({
    params: Promise.resolve({ id }),
  });
  return render(jsx);
}

describe("ImprimirReceitaPage", () => {
  beforeEach(() => {
    mockReceita.tipo = "simples";
  });

  it("renderiza nome do paciente \"Maria Silva\"", async () => {
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });

  it("renderiza medicamentos \"Amoxicilina 500mg\"", async () => {
    await renderPage();
    expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
  });

  it("renderiza observações \"Tomar com água\"", async () => {
    await renderPage();
    expect(screen.getByText("Tomar com água")).toBeInTheDocument();
  });

  it("renderiza tipo da receita \"Receita Simples\"", async () => {
    await renderPage();
    expect(screen.getByText("Receita Simples")).toBeInTheDocument();
  });

  it("renderiza dados do profissional", async () => {
    await renderPage();
    expect(screen.getByText("Dr. João")).toBeInTheDocument();
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    expect(screen.getByText(/CRM.*12345-SP/)).toBeInTheDocument();
  });

  it("renderiza dados da clínica", async () => {
    await renderPage();
    expect(screen.getByText("Clínica Teste")).toBeInTheDocument();
  });

  it("chama notFound para ID inválido", async () => {
    await expect(renderPage("invalid")).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  describe("layout controle especial", () => {
    beforeEach(() => {
      mockReceita.tipo = "controle_especial";
    });

    it("renderiza título 'RECEITUÁRIO DE CONTROLE ESPECIAL'", async () => {
      await renderPage();
      expect(screen.getByText(/Receituário de Controle Especial/i)).toBeInTheDocument();
    });

    it("renderiza indicação de retenção da farmácia", async () => {
      await renderPage();
      expect(screen.getByText(/1ª Via/)).toBeInTheDocument();
      expect(screen.getByText(/Retenção da Farmácia/)).toBeInTheDocument();
    });

    it("renderiza indicação de orientação ao paciente", async () => {
      await renderPage();
      expect(screen.getByText(/2ª Via/)).toBeInTheDocument();
      expect(screen.getByText(/Orientação ao Paciente/)).toBeInTheDocument();
    });

    it("renderiza seção de identificação do comprador", async () => {
      await renderPage();
      expect(screen.getByText("Identificação do Comprador")).toBeInTheDocument();
      expect(screen.getByText("Identidade:")).toBeInTheDocument();
      expect(screen.getByText("Órgão Emissor:")).toBeInTheDocument();
    });

    it("renderiza seção de identificação do fornecedor", async () => {
      await renderPage();
      expect(screen.getByText("Identificação do Fornecedor")).toBeInTheDocument();
      expect(screen.getByText("Assinatura do Farmacêutico:")).toBeInTheDocument();
    });

    it("renderiza dados do paciente e profissional", async () => {
      await renderPage();
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
      expect(screen.getByText("Dr. João")).toBeInTheDocument();
      expect(screen.getByText(/CRM.*12345-SP/)).toBeInTheDocument();
    });
  });
});
