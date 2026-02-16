import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./tabs", () => ({
  Tabs: ({ papel }: { papel: string }) => <div data-testid="tabs" data-papel={papel} />,
}));

vi.mock("./tab-utils", () => ({
  isValidTab: (tab: string) => ["consultorio", "profissional", "horarios", "valores", "conta", "aparencia", "clinicas", "dados"].includes(tab),
  getDefaultTab: () => "consultorio",
}));

vi.mock("./consultorio-form", () => ({
  ConsultorioForm: ({ clinica }: { clinica: Record<string, unknown> }) => (
    <form data-testid="consultorio-form" data-clinica={JSON.stringify(clinica)} />
  ),
}));

vi.mock("./profissional-form", () => ({
  ProfissionalForm: () => <form data-testid="profissional-form" />,
}));

vi.mock("./horarios-form", () => ({
  HorariosForm: () => <form data-testid="horarios-form" />,
}));

vi.mock("./conta-form", () => ({
  ContaForm: ({ email }: { email: string }) => (
    <div data-testid="conta-form" data-email={email} />
  ),
}));

vi.mock("./aparencia-form", () => ({
  AparenciaForm: () => <form data-testid="aparencia-form" />,
}));

vi.mock("./dados-form", () => ({
  DadosForm: () => <form data-testid="dados-form" />,
}));

vi.mock("./clinicas-form", () => ({
  ClinicasForm: () => <form data-testid="clinicas-form" />,
}));

vi.mock("./valores-form", () => ({
  ValoresForm: () => <form data-testid="valores-form" />,
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "gestor",
    userId: "user-1",
  }),
  getClinicasDoUsuario: vi.fn().mockResolvedValue([
    { id: "clinic-1", nome: "Clínica Teste", papel: "gestor" },
  ]),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ data: [{ id: "clinic-1", user_id: "user-1", papel: "gestor" }] }),
      }),
    }),
    auth: {
      admin: {
        listUsers: () => Promise.resolve({ data: { users: [{ id: "user-1", email: "doc@test.com" }] } }),
        getUserById: (id: string) => Promise.resolve({ data: { user: { id, email: "doc@test.com" } } }),
      },
    },
  }),
}));

const mockClinica = {
  data: { nome: "Clínica Teste", cnpj: "12345678000100", telefone: null, endereco: null, cidade: null, estado: null },
};
const mockConfigData: { data: { chave: string; valor: string }[] | null } = {
  data: [
    { chave: "duracao_consulta", valor: "30" },
  ],
};
const mockUser: { data: { user: { email: string } | null } } = {
  data: { user: { email: "doc@test.com" } },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: (table: string) => ({
        select: (cols?: string) => {
          if (table === "clinicas") {
            if (cols === "id, ativo") {
              return {
                in: () => Promise.resolve({ data: [{ id: "clinic-1", ativo: true }] }),
              };
            }
            return {
              eq: () => ({ single: () => Promise.resolve(mockClinica) }),
            };
          }
          if (table === "usuarios_clinicas") {
            return { in: () => Promise.resolve({ data: [] }) };
          }
          // configuracoes
          return Promise.resolve(mockConfigData);
        },
      }),
      auth: { getUser: () => Promise.resolve(mockUser) },
    }),
}));

import ConfiguracoesPage from "./page";

async function renderPage(searchParams: { tab?: string } = {}) {
  const jsx = await ConfiguracoesPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("ConfiguracoesPage", () => {
  it("renderiza o título Configurações", async () => {
    await renderPage();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("renderiza o componente Tabs com papel", async () => {
    await renderPage();
    const tabs = screen.getByTestId("tabs");
    expect(tabs).toBeInTheDocument();
    expect(tabs).toHaveAttribute("data-papel", "gestor");
  });

  it("renderiza ConsultorioForm por padrão", async () => {
    await renderPage();
    expect(screen.getByTestId("consultorio-form")).toBeInTheDocument();
  });

  it("passa clinica data para ConsultorioForm", async () => {
    await renderPage();
    const form = screen.getByTestId("consultorio-form");
    const clinica = JSON.parse(form.getAttribute("data-clinica") || "{}");
    expect(clinica.nome).toBe("Clínica Teste");
    expect(clinica.cnpj).toBe("12345678000100");
  });

  it("renderiza ProfissionalForm quando tab=profissional", async () => {
    await renderPage({ tab: "profissional" });
    expect(screen.getByTestId("profissional-form")).toBeInTheDocument();
    expect(screen.queryByTestId("consultorio-form")).not.toBeInTheDocument();
  });

  it("renderiza HorariosForm quando tab=horarios", async () => {
    await renderPage({ tab: "horarios" });
    expect(screen.getByTestId("horarios-form")).toBeInTheDocument();
  });

  it("renderiza ContaForm quando tab=conta", async () => {
    await renderPage({ tab: "conta" });
    expect(screen.getByTestId("conta-form")).toBeInTheDocument();
    expect(screen.getByTestId("conta-form")).toHaveAttribute("data-email", "doc@test.com");
  });

  it("passa email vazio quando user é null", async () => {
    mockUser.data = { user: null };
    await renderPage({ tab: "conta" });
    expect(screen.getByTestId("conta-form")).toHaveAttribute("data-email", "");
    mockUser.data = { user: { email: "doc@test.com" } };
  });

  it("renderiza AparenciaForm quando tab=aparencia", async () => {
    await renderPage({ tab: "aparencia" });
    expect(screen.getByTestId("aparencia-form")).toBeInTheDocument();
  });

  it("renderiza ValoresForm quando tab=valores", async () => {
    await renderPage({ tab: "valores" });
    expect(screen.getByTestId("valores-form")).toBeInTheDocument();
  });

  it("renderiza ClinicasForm quando tab=clinicas", async () => {
    await renderPage({ tab: "clinicas" });
    expect(screen.getByTestId("clinicas-form")).toBeInTheDocument();
  });

  it("renderiza DadosForm quando tab=dados", async () => {
    await renderPage({ tab: "dados" });
    expect(screen.getByTestId("dados-form")).toBeInTheDocument();
  });

  it("transforma rows null em config vazio", async () => {
    mockConfigData.data = null;
    await renderPage({ tab: "profissional" });
    // Should render without errors even with null config data
    expect(screen.getByTestId("profissional-form")).toBeInTheDocument();
    mockConfigData.data = [{ chave: "duracao_consulta", valor: "30" }];
  });

  it("tab inválido faz fallback para consultorio", async () => {
    await renderPage({ tab: "invalido" });
    expect(screen.getByTestId("consultorio-form")).toBeInTheDocument();
  });
});
