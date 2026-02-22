import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

let mockUser = { id: "user-123", email: "test@example.com" };

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

vi.mock("@/lib/clinica", () => ({ getMedicoId: vi.fn().mockResolvedValue("doc-1") }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () => Promise.resolve({ data: { user: mockUser } }),
      },
    }),
}));

vi.mock("./prontuario-form", () => ({
  ProntuarioForm: (props: Record<string, unknown>) => {
    const defaults = props.defaults as Record<string, string> | undefined;
    return (
      <form data-testid="prontuario-form" data-patient-id={defaults?.paciente_id ?? ""} data-tipo={defaults?.tipo ?? ""} data-cancel-href={props.cancelHref ?? ""} data-user-id={props.userId ?? ""} data-has-seeds={props.seedTemplates ? "true" : "false"} />
    );
  },
}));

import NovoProntuarioPage from "./page";

async function renderPage(searchParams: { paciente_id?: string; paciente_nome?: string; tipo?: string } = {}) {
  const jsx = await NovoProntuarioPage({ searchParams: Promise.resolve(searchParams) });
  return render(jsx);
}

describe("NovoProntuarioPage", () => {
  it("renderiza o título Nova evolução", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Nova evolução" })).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para prontuários", async () => {
    await renderPage();
    const link = screen.getByText("Prontuários").closest("a");
    expect(link).toHaveAttribute("href", "/prontuarios");
  });

  it("renderiza o ProntuarioForm com paciente padrão", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", paciente_nome: "Maria" });
    const form = screen.getByTestId("prontuario-form");
    expect(form).toHaveAttribute("data-patient-id", "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("usa 'Paciente' como fallback quando paciente_nome não é fornecido", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" });
    expect(screen.getByText("Paciente")).toBeInTheDocument();
    const link = screen.getByText("Paciente").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("passa tipo válido como default para ProntuarioForm", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", paciente_nome: "Maria", tipo: "consulta" });
    const form = screen.getByTestId("prontuario-form");
    expect(form).toHaveAttribute("data-tipo", "consulta");
  });

  it("ignora tipo inválido", async () => {
    await renderPage({ paciente_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", paciente_nome: "Maria", tipo: "invalido" });
    const form = screen.getByTestId("prontuario-form");
    expect(form).toHaveAttribute("data-tipo", "");
  });

  it("passa userId para o ProntuarioForm", async () => {
    mockUser = { id: "user-abc", email: "test@example.com" };
    await renderPage();
    const form = screen.getByTestId("prontuario-form");
    expect(form).toHaveAttribute("data-user-id", "user-abc");
  });

  it("passa seedTemplates quando email é do marcocomper", async () => {
    mockUser = { id: "user-marco", email: "marcocomper@yahoo.com.br" };
    await renderPage();
    const form = screen.getByTestId("prontuario-form");
    expect(form).toHaveAttribute("data-has-seeds", "true");
  });

  it("não passa seedTemplates para outros emails", async () => {
    mockUser = { id: "user-other", email: "outro@email.com" };
    await renderPage();
    const form = screen.getByTestId("prontuario-form");
    expect(form).toHaveAttribute("data-has-seeds", "false");
  });
});
