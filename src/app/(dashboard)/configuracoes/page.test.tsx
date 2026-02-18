import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./tabs", () => ({
  Tabs: ({ papel }: { papel: string }) => <div data-testid="tabs" data-papel={papel} />,
}));

vi.mock("./tab-utils", () => ({
  isValidTab: (tab: string) => ["clinica", "minha-conta", "medicamentos", "exames", "gestao", "usuarios"].includes(tab),
  getDefaultTab: () => "clinica",
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

vi.mock("./medicamentos-form", () => ({
  MedicamentosForm: () => <form data-testid="medicamentos-form" />,
}));

vi.mock("./catalogo-exames-form", () => ({
  CatalogoExamesForm: () => <form data-testid="catalogo-exames-form" />,
}));

vi.mock("./horarios-profissional-form", () => ({
  HorariosProfissionalForm: () => <form data-testid="horarios-profissional-form" />,
}));

vi.mock("./usuarios-tab", () => ({
  UsuariosTab: ({ clinicas }: { clinicas?: { id: string; nome: string }[] }) => (
    <div data-testid="usuarios-tab" data-clinicas={JSON.stringify(clinicas ?? [])} />
  ),
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
  isProfissional: (papel: string) => ["superadmin", "gestor", "profissional_saude"].includes(papel),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const chainResult = Promise.resolve({ data: [], count: 0, error: null });
      const eqChain: Record<string, unknown> = {
        in: () => ({ order: () => ({ range: () => chainResult }) }),
        eq: () => eqChain,
        order: () => ({ range: () => chainResult }),
      };
      return {
        select: () => ({
          in: () => Promise.resolve({ data: [] }),
          eq: () => eqChain,
        }),
      };
    },
    auth: {
      admin: {
        listUsers: () => Promise.resolve({ data: { users: [] } }),
        getUserById: (id: string) => Promise.resolve({ data: { user: { id, email: "doc@test.com" } } }),
      },
    },
  }),
  getAuthEmailMap: () => Promise.resolve({}),
}));

const mockClinica = {
  data: { nome: "Clínica Teste", cnpj: "12345678000100", telefone: null, telefone2: null, telefone3: null, endereco: null, cidade: null, estado: null },
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
            const chainResult = Promise.resolve({ data: [], count: 0, error: null });
            const chain = {
              in: () => Promise.resolve({ data: [] }),
              eq: () => ({
                in: () => ({ order: () => ({ range: () => chainResult }) }),
                eq: () => ({ order: () => ({ range: () => chainResult }) }),
                order: () => ({ range: () => chainResult }),
              }),
            };
            return chain;
          }
          if (table === "horarios_profissional") {
            return {
              eq: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }),
            };
          }
          if (table === "medicamentos") {
            return {
              order: () => Promise.resolve({ data: [] }),
            };
          }
          if (table === "catalogo_exames") {
            return {
              order: () => Promise.resolve({ data: [] }),
            };
          }
          // configuracoes
          return Promise.resolve(mockConfigData);
        },
      }),
      auth: { getUser: () => Promise.resolve(mockUser) },
    }),
}));

vi.mock("@/app/(dashboard)/agenda/utils", () => ({
  invalidarCacheHorario: vi.fn(),
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

  it("renderiza ConsultorioForm por padrão (tab=clinica)", async () => {
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

  it("renderiza HorariosForm e ValoresForm junto com ConsultorioForm na tab clinica", async () => {
    await renderPage();
    expect(screen.getByTestId("consultorio-form")).toBeInTheDocument();
    expect(screen.getByTestId("horarios-form")).toBeInTheDocument();
    expect(screen.getByTestId("valores-form")).toBeInTheDocument();
  });

  it("renderiza ContaForm quando tab=minha-conta", async () => {
    await renderPage({ tab: "minha-conta" });
    expect(screen.getByTestId("conta-form")).toBeInTheDocument();
    expect(screen.getByTestId("conta-form")).toHaveAttribute("data-email", "doc@test.com");
  });

  it("renderiza ProfissionalForm e AparenciaForm na tab minha-conta", async () => {
    await renderPage({ tab: "minha-conta" });
    expect(screen.getByTestId("profissional-form")).toBeInTheDocument();
    expect(screen.getByTestId("aparencia-form")).toBeInTheDocument();
    expect(screen.queryByTestId("consultorio-form")).not.toBeInTheDocument();
  });

  it("passa email vazio quando user é null", async () => {
    mockUser.data = { user: null };
    await renderPage({ tab: "minha-conta" });
    expect(screen.getByTestId("conta-form")).toHaveAttribute("data-email", "");
    mockUser.data = { user: { email: "doc@test.com" } };
  });

  it("renderiza ClinicasForm e DadosForm quando tab=gestao", async () => {
    await renderPage({ tab: "gestao" });
    expect(screen.getByTestId("clinicas-form")).toBeInTheDocument();
    expect(screen.getByTestId("dados-form")).toBeInTheDocument();
  });

  it("transforma rows null em config vazio", async () => {
    mockConfigData.data = null;
    await renderPage({ tab: "minha-conta" });
    expect(screen.getByTestId("conta-form")).toBeInTheDocument();
    mockConfigData.data = [{ chave: "duracao_consulta", valor: "30" }];
  });

  it("tab inválido faz fallback para clinica", async () => {
    await renderPage({ tab: "invalido" });
    expect(screen.getByTestId("consultorio-form")).toBeInTheDocument();
  });

  it("renderiza UsuariosTab quando tab=usuarios", async () => {
    await renderPage({ tab: "usuarios" });
    expect(screen.getByTestId("usuarios-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("consultorio-form")).not.toBeInTheDocument();
  });
});
