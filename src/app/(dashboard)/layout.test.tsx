import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/sidebar", () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

vi.mock("@/components/toast-handler", () => ({
  ToastHandler: () => null,
}));

vi.mock("@/components/keyboard-shortcuts", () => ({
  KeyboardShortcuts: () => null,
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: vi.fn().mockResolvedValue({
    clinicaId: "clinic-1",
    clinicaNome: "Clínica Teste",
    papel: "medico",
    userId: "user-1",
  }),
  getClinicasDoUsuario: vi.fn().mockResolvedValue([
    { id: "clinic-1", nome: "Clínica Teste", papel: "medico" },
  ]),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ data: [] }),
      }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { email: "test@test.com" } } }),
    },
  }),
}));

import DashboardLayout from "./layout";

async function renderAsync(ui: React.ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolved = await (ui.type as any)(ui.props);
  return render(resolved);
}

describe("DashboardLayout", () => {
  it("renderiza a Sidebar", async () => {
    await renderAsync(<DashboardLayout><p>conteúdo</p></DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renderiza o conteúdo children dentro do main", async () => {
    await renderAsync(<DashboardLayout><p>conteúdo de teste</p></DashboardLayout>);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent("conteúdo de teste");
  });

  it("renderiza o layout com estrutura flex", async () => {
    const { container } = await renderAsync(
      <DashboardLayout><p>conteúdo</p></DashboardLayout>
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("flex");
    expect(wrapper?.className).toContain("h-screen");
  });
});
