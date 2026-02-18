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
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../../novo/usuario-form", () => ({
  UsuarioForm: ({ defaults }: { defaults?: Record<string, unknown> }) => (
    <form data-testid="usuario-form" data-defaults={JSON.stringify(defaults ?? {})} />
  ),
}));

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: ({ items }: { items: { label: string; href?: string }[] }) => (
    <nav aria-label="Breadcrumb">
      {items.map((item, i) =>
        item.href ? (
          <a key={i} href={item.href}>{item.label}</a>
        ) : (
          <span key={i}>{item.label}</span>
        )
      )}
    </nav>
  ),
}));

let mockVinculo: Record<string, unknown> | null = null;
let mockCtx: Record<string, unknown> | null = null;
const mockGetUserById = vi.fn().mockResolvedValue({
  data: { user: { email: "usuario@teste.com" } },
});

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: () => Promise.resolve(mockCtx),
  isGestor: (papel: string) => papel === "superadmin" || papel === "gestor",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockVinculo }),
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
        getUserById: (...args: unknown[]) => mockGetUserById(...args),
      },
    },
  }),
}));

import EditarUsuarioPage from "./page";

const vinculoMock = {
  id: "vinc-1",
  user_id: "user-abc",
  papel: "secretaria",
  clinica_id: "clinica-123",
  clinicas: { nome: "Clínica Alpha" },
};

async function renderPage(id = "vinc-1") {
  const jsx = await EditarUsuarioPage({ params: Promise.resolve({ id }) });
  return render(jsx);
}

describe("EditarUsuarioPage", () => {
  beforeEach(() => {
    mockVinculo = vinculoMock;
    mockCtx = {
      clinicaId: "clinica-123",
      clinicaNome: "Clínica Alpha",
      papel: "gestor",
      userId: "user-456",
    };
    mockNotFound.mockClear();
    mockGetUserById.mockResolvedValue({
      data: { user: { email: "usuario@teste.com" } },
    });
  });

  it("chama notFound quando contexto é null", async () => {
    mockCtx = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("chama notFound quando não é gestor", async () => {
    mockCtx = { ...mockCtx, papel: "secretaria" };
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("chama notFound quando vínculo não existe", async () => {
    mockVinculo = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renderiza o título Editar usuário", async () => {
    await renderPage();
    expect(screen.getByText("Editar usuário")).toBeInTheDocument();
  });

  it("renderiza o breadcrumb com email", async () => {
    await renderPage();
    expect(screen.getByText("Usuários")).toBeInTheDocument();
    expect(screen.getByText("usuario@teste.com")).toBeInTheDocument();
    expect(screen.getByText("Editar")).toBeInTheDocument();
  });

  it("renderiza o UsuarioForm com defaults", async () => {
    await renderPage();
    const form = screen.getByTestId("usuario-form");
    expect(form).toBeInTheDocument();
    const defaults = JSON.parse(form.getAttribute("data-defaults")!);
    expect(defaults.vinculo_id).toBe("vinc-1");
    expect(defaults.user_id).toBe("user-abc");
    expect(defaults.email).toBe("usuario@teste.com");
    expect(defaults.papel).toBe("secretaria");
    expect(defaults.clinica_nome).toBe("Clínica Alpha");
  });

  it("passa link de volta para /usuarios no breadcrumb", async () => {
    await renderPage();
    const link = screen.getByText("Usuários").closest("a");
    expect(link).toHaveAttribute("href", "/configuracoes?tab=usuarios");
  });
});
