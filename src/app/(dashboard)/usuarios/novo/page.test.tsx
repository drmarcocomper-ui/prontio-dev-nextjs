import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: ({ items }: { items: { label: string; href?: string }[] }) => (
    <nav aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
  ),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicasDoUsuario: vi.fn().mockResolvedValue([
    { id: "c-1", nome: "Clínica Alpha", papel: "gestor" },
  ]),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

vi.mock("../actions", () => ({
  criarUsuario: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: () => [{}, vi.fn(), false],
  };
});

import NovoUsuarioPage from "./page";

describe("NovoUsuarioPage", () => {
  it("renderiza título e breadcrumb", async () => {
    const Page = await NovoUsuarioPage();
    render(Page);
    expect(screen.getAllByText("Novo usuário").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Usuários")).toBeInTheDocument();
  });

  it("renderiza formulário com clínicas", async () => {
    const Page = await NovoUsuarioPage();
    render(Page);
    const select = screen.getByLabelText(/Clínica/);
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll("option")).toHaveLength(1);
  });
});
