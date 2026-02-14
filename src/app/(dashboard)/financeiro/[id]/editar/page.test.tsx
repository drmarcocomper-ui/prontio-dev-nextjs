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

vi.mock("../../constants", async () => {
  const actual = await vi.importActual("../../constants");
  return { ...actual };
});

vi.mock("@/lib/clinica", () => ({
  getMedicoId: vi.fn().mockResolvedValue("doc-1"),
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "profissional_saude",
    userId: "user-1",
  }),
}));

vi.mock("../../novo/transacao-form", () => ({
  TransacaoForm: ({ defaults }: { defaults: Record<string, unknown> }) => (
    <form data-testid="transacao-form" data-defaults={JSON.stringify(defaults)} />
  ),
}));

let mockTransacao: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockTransacao }),
            }),
          }),
        }),
      }),
    }),
}));

import EditarTransacaoPage from "./page";

const transacaoMock = {
  id: "t-123",
  tipo: "receita",
  categoria: "consulta",
  descricao: "Consulta particular",
  valor: 350,
  data: "2024-06-15",
  paciente_id: "pac-456",
  forma_pagamento: "pix",
  status: "pago",
  observacoes: "Obs teste",
  pacientes: {
    id: "pac-456",
    nome: "Maria Silva",
  },
};

async function renderPage(id = "t-123") {
  const jsx = await EditarTransacaoPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarTransacaoPage", () => {
  beforeEach(() => {
    mockTransacao = transacaoMock;
    mockNotFound.mockClear();
  });

  it("chama notFound quando transação não existe", async () => {
    mockTransacao = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar transação", async () => {
    await renderPage();
    expect(screen.getByText("Editar transação")).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para a transação", async () => {
    await renderPage();
    const link = screen.getByText("Consulta particular").closest("a");
    expect(link).toHaveAttribute("href", "/financeiro/t-123");
  });

  it("renderiza o TransacaoForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("transacao-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.id).toBe("t-123");
    expect(defaults.tipo).toBe("receita");
    expect(defaults.categoria).toBe("consulta");
    expect(defaults.descricao).toBe("Consulta particular");
    expect(defaults.valor).toBe("350,00");
    expect(defaults.data).toBe("2024-06-15");
    expect(defaults.paciente_id).toBe("pac-456");
    expect(defaults.paciente_nome).toBe("Maria Silva");
    expect(defaults.forma_pagamento).toBe("pix");
    expect(defaults.status).toBe("pago");
  });

  it("envia null para paciente quando não há", async () => {
    mockTransacao = { ...transacaoMock, pacientes: null, paciente_id: null };
    await renderPage();
    const form = screen.getByTestId("transacao-form");
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.paciente_id).toBeNull();
    expect(defaults.paciente_nome).toBeNull();
  });

  it("converte valor 0 para '0,00'", async () => {
    mockTransacao = { ...transacaoMock, valor: 0 };
    await renderPage();
    const form = screen.getByTestId("transacao-form");
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.valor).toBe("0,00");
  });

  it("retorna valor vazio quando valor é NaN", async () => {
    mockTransacao = { ...transacaoMock, valor: NaN };
    await renderPage();
    const form = screen.getByTestId("transacao-form");
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.valor).toBe("");
  });
});
