import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useActionState: () => [formState.current, vi.fn(), formPending.current] };
});

vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

vi.mock("./actions", () => ({
  salvarProfissional: vi.fn(),
}));

vi.mock("./constants", async () => {
  const actual = await vi.importActual("./constants");
  return { ...actual };
});

import { ProfissionalForm } from "./profissional-form";

const emptyDefaults: Record<string, string> = {};

const filledDefaults: Record<string, string> = {
  nome_profissional: "Dr. João",
  especialidade: "Cardiologia",
  crm: "CRM/SP 123456",
  rqe: "12345",
  email_profissional: "joao@clinica.com",
};

describe("ProfissionalForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("renderiza todos os campos", () => {
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
    expect(screen.getByLabelText("CRM")).toBeInTheDocument();
    expect(screen.getByLabelText("RQE")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail profissional")).toBeInTheDocument();
  });

  it("preenche valores padrão quando fornecidos", () => {
    render(<ProfissionalForm defaults={filledDefaults} />);
    expect(screen.getByLabelText("Nome completo")).toHaveValue("Dr. João");
    expect(screen.getByLabelText("Especialidade")).toHaveValue("Cardiologia");
    expect(screen.getByLabelText("CRM")).toHaveValue("CRM/SP 123456");
    expect(screen.getByLabelText("RQE")).toHaveValue("12345");
    expect(screen.getByLabelText("E-mail profissional")).toHaveValue("joao@clinica.com");
  });

  it("renderiza o botão Salvar", () => {
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("campo email é do tipo email", () => {
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText("E-mail profissional")).toHaveAttribute("type", "email");
  });

  it("campo nome_profissional tem maxLength de 255", () => {
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText("Nome completo")).toHaveAttribute("maxlength", "255");
  });

  it("campo especialidade tem maxLength de 100", () => {
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText("Especialidade")).toHaveAttribute("maxlength", "100");
  });

  it("campo crm tem maxLength de 50", () => {
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText("CRM")).toHaveAttribute("maxlength", "50");
  });

  it("campo rqe tem maxLength de 50", () => {
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText("RQE")).toHaveAttribute("maxlength", "50");
  });

  it("campo email tem maxLength de 254", () => {
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText("E-mail profissional")).toHaveAttribute("maxlength", "254");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar configurações. Tente novamente." };
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByText("Erro ao salvar configurações. Tente novamente.")).toBeInTheDocument();
  });

  it("chama toast.success quando state.success é true", () => {
    formState.current = { success: true };
    render(<ProfissionalForm defaults={emptyDefaults} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Configurações salvas com sucesso.");
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<ProfissionalForm defaults={emptyDefaults} />);
    const button = screen.getByRole("button", { name: /Salvar/ });
    expect(button).toBeDisabled();
  });
});
