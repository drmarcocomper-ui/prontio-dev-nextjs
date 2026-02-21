import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

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
        if (table === "encaminhamentos") {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: "550e8400-e29b-41d4-a716-446655440000",
                      data: "2024-06-15",
                      profissional_destino: "Dr. Carlos Cardiologista",
                      especialidade: "Cardiologia",
                      telefone_profissional: "11999998888",
                      motivo: "Sopro cardíaco detectado.",
                      observacoes: "Urgente",
                      pacientes: { id: "p-1", nome: "Maria Silva", cpf: "52998224725" },
                    },
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
                    data: { nome: "Clínica Teste", endereco: "Rua A", telefone: "11999" },
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
                    { chave: "especialidade", valor: "Clínico Geral" },
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
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "c-1",
    clinicaNome: "Clínica Teste",
    papel: "superadmin",
    userId: "u-1",
  }),
  getMedicoId: vi.fn().mockResolvedValue("doc-1"),
}));

vi.mock("@/lib/validators", () => ({
  UUID_RE: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
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
    formatDateMedium: (d: string) => d,
    formatCPF: (cpf: string) => cpf,
    formatPhone: (p: string) => p,
  };
});

import ImprimirEncaminhamentoPage from "./page";

async function renderPage(id = "550e8400-e29b-41d4-a716-446655440000") {
  const jsx = await ImprimirEncaminhamentoPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("ImprimirEncaminhamentoPage", () => {
  it("renderiza nome do paciente", async () => {
    await renderPage();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });

  it("renderiza profissional de destino", async () => {
    await renderPage();
    expect(screen.getByText(/Dr. Carlos Cardiologista/)).toBeInTheDocument();
  });

  it("renderiza especialidade", async () => {
    await renderPage();
    expect(screen.getByText(/Cardiologia/)).toBeInTheDocument();
  });

  it("renderiza motivo do encaminhamento", async () => {
    await renderPage();
    expect(screen.getByText("Sopro cardíaco detectado.")).toBeInTheDocument();
  });

  it("renderiza observações", async () => {
    await renderPage();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("renderiza título Carta de Encaminhamento", async () => {
    await renderPage();
    expect(screen.getByText("Carta de Encaminhamento")).toBeInTheDocument();
  });

  it("renderiza dados do profissional remetente", async () => {
    await renderPage();
    expect(screen.getByText("Dr. João")).toBeInTheDocument();
    expect(screen.getByText("Clínico Geral")).toBeInTheDocument();
    expect(screen.getByText(/CRM.*12345-SP/)).toBeInTheDocument();
  });

  it("renderiza dados da clínica", async () => {
    await renderPage();
    expect(screen.getByText("Clínica Teste")).toBeInTheDocument();
  });

  it("renderiza botão de imprimir", async () => {
    await renderPage();
    expect(screen.getByTestId("print-button")).toBeInTheDocument();
  });

  it("chama notFound para ID inválido", async () => {
    await expect(renderPage("invalid")).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });
});
