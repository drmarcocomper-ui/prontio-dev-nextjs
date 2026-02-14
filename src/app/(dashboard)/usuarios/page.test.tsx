import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockVinculos = vi.hoisted(() => ({
  current: {
    data: [
      {
        id: "v-1",
        user_id: "u-1",
        papel: "gestor",
        clinica_id: "c-1",
        created_at: "2024-01-15T10:00:00Z",
        clinicas: { nome: "Clínica Alpha" },
      },
      {
        id: "v-2",
        user_id: "u-2",
        papel: "secretaria",
        clinica_id: "c-1",
        created_at: "2024-02-01T12:00:00Z",
        clinicas: { nome: "Clínica Alpha" },
      },
    ] as unknown[] | null,
    count: 2 as number | null,
    error: null as { message: string } | null,
  },
}));

const mockListUsers = vi.hoisted(() => vi.fn().mockResolvedValue({
  data: {
    users: [
      { id: "u-1", email: "gestor@test.com" },
      { id: "u-2", email: "sec@test.com" },
    ],
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => ({
            order: () => ({
              range: () => Promise.resolve(mockVinculos.current),
            }),
          }),
          order: () => ({
            range: () => Promise.resolve(mockVinculos.current),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
      },
    },
  }),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "c-1",
    clinicaNome: "Clínica Alpha",
    papel: "gestor",
    userId: "u-1",
  }),
}));

vi.mock("@/lib/sanitize", () => ({
  escapeLikePattern: (v: string) => v,
}));

vi.mock("@/components/pagination", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("@/components/search-input", () => ({
  SearchInput: () => <input placeholder="Buscar por e-mail..." />,
}));

vi.mock("@/components/empty-state", () => ({
  EmptyStateIllustration: () => <div data-testid="empty-illustration" />,
}));

vi.mock("./filters", () => ({
  PapelFilter: () => <select aria-label="Filtrar por papel" />,
}));

vi.mock("./usuario-actions", () => ({
  UsuarioRowActions: ({ isSelf }: { isSelf: boolean }) =>
    isSelf ? <span>Você</span> : <span>Ações</span>,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: () => [{}, vi.fn(), false],
  };
});

import UsuariosPage from "./page";
import { getClinicaAtual } from "@/lib/clinica";

describe("UsuariosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVinculos.current = {
      data: [
        {
          id: "v-1",
          user_id: "u-1",
          papel: "gestor",
          clinica_id: "c-1",
          created_at: "2024-01-15T10:00:00Z",
          clinicas: { nome: "Clínica Alpha" },
        },
        {
          id: "v-2",
          user_id: "u-2",
          papel: "secretaria",
          clinica_id: "c-1",
          created_at: "2024-02-01T12:00:00Z",
          clinicas: { nome: "Clínica Alpha" },
        },
      ],
      count: 2,
      error: null,
    };
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          { id: "u-1", email: "gestor@test.com" },
          { id: "u-2", email: "sec@test.com" },
        ],
      },
    });
  });

  it("renderiza título e contagem", async () => {
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText("Usuários")).toBeInTheDocument();
    expect(screen.getByText("2 usuários vinculados")).toBeInTheDocument();
  });

  it("renderiza link para novo usuário", async () => {
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    const link = screen.getByText("Novo usuário").closest("a");
    expect(link).toHaveAttribute("href", "/usuarios/novo");
  });

  it("renderiza emails dos usuários na tabela desktop", async () => {
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getAllByText("gestor@test.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("sec@test.com").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza badges de papel", async () => {
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getAllByText("Gestor").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Secretária").length).toBeGreaterThanOrEqual(1);
  });

  it("mostra badge 'Você' para o usuário atual", async () => {
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getAllByText("Você").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza SearchInput e PapelFilter", async () => {
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByPlaceholderText("Buscar por e-mail...")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por papel")).toBeInTheDocument();
  });

  it("renderiza pagination", async () => {
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("mostra empty state quando não há resultados", async () => {
    mockVinculos.current = { data: [], count: 0, error: null };
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText("Nenhum usuário encontrado")).toBeInTheDocument();
    expect(screen.getByText("Comece criando o primeiro usuário.")).toBeInTheDocument();
  });

  it("mostra mensagem de busca no empty state quando q está presente", async () => {
    mockVinculos.current = { data: [], count: 0, error: null };
    mockListUsers.mockResolvedValueOnce({ data: { users: [] } });
    const Page = await UsuariosPage({ searchParams: Promise.resolve({ q: "teste" }) });
    render(Page);
    expect(screen.getByText("Nenhum usuário encontrado")).toBeInTheDocument();
    expect(screen.getByText("Tente buscar com outros termos.")).toBeInTheDocument();
  });

  it("mostra erro quando contexto é null", async () => {
    vi.mocked(getClinicaAtual).mockResolvedValueOnce(null);
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText("Contexto de clínica não encontrado.")).toBeInTheDocument();
  });

  it("mostra erro quando query falha", async () => {
    mockVinculos.current = { data: null, count: null, error: { message: "DB error" } };
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText("Não foi possível carregar os dados. Tente recarregar a página.")).toBeInTheDocument();
  });

  it("renderiza contagem singular", async () => {
    mockVinculos.current = {
      data: [{
        id: "v-1",
        user_id: "u-1",
        papel: "gestor",
        clinica_id: "c-1",
        created_at: "2024-01-15T10:00:00Z",
        clinicas: { nome: "Clínica Alpha" },
      }],
      count: 1,
      error: null,
    };
    const Page = await UsuariosPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText("1 usuário vinculado")).toBeInTheDocument();
  });
});
