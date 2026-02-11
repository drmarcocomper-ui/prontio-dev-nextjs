import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./tabs", () => ({
  Tabs: () => <div data-testid="tabs" />,
}));

vi.mock("./consultorio-form", () => ({
  ConsultorioForm: ({ defaults }: { defaults: Record<string, string> }) => (
    <form data-testid="consultorio-form" data-defaults={JSON.stringify(defaults)} />
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

const mockConfigData = {
  data: [
    { chave: "nome_consultorio", valor: "Clínica Teste" },
    { chave: "cnpj", valor: "12345678000100" },
  ],
};

const mockUser = {
  data: { user: { email: "doc@test.com" } },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({ select: () => Promise.resolve(mockConfigData) }),
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

  it("renderiza o componente Tabs", async () => {
    await renderPage();
    expect(screen.getByTestId("tabs")).toBeInTheDocument();
  });

  it("renderiza ConsultorioForm por padrão", async () => {
    await renderPage();
    expect(screen.getByTestId("consultorio-form")).toBeInTheDocument();
  });

  it("passa config como defaults para ConsultorioForm", async () => {
    await renderPage();
    const form = screen.getByTestId("consultorio-form");
    const defaults = JSON.parse(form.getAttribute("data-defaults") || "{}");
    expect(defaults.nome_consultorio).toBe("Clínica Teste");
    expect(defaults.cnpj).toBe("12345678000100");
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

  it("transforma rows null em config vazio", async () => {
    mockConfigData.data = null;
    await renderPage();
    const form = screen.getByTestId("consultorio-form");
    const defaults = JSON.parse(form.getAttribute("data-defaults") || "{}");
    expect(Object.keys(defaults).length).toBe(0);
    mockConfigData.data = [
      { chave: "nome_consultorio", valor: "Clínica Teste" },
      { chave: "cnpj", valor: "12345678000100" },
    ];
  });
});
