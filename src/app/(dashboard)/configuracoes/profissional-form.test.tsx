import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./actions", () => ({
  salvarConfiguracoes: vi.fn(),
}));

import { ProfissionalForm } from "./profissional-form";

const emptyDefaults: Record<string, string> = {};

const filledDefaults: Record<string, string> = {
  nome_consultorio: "Clínica Saúde",
  nome_profissional: "Dr. João",
  especialidade: "Cardiologia",
  crm: "CRM/SP 123456",
  rqe: "12345",
  email_profissional: "joao@clinica.com",
};

describe("ProfissionalForm", () => {
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

  it("inclui campo hidden com nome_consultorio", () => {
    render(<ProfissionalForm defaults={filledDefaults} />);
    const hidden = document.querySelector('input[name="config_nome_consultorio"]') as HTMLInputElement;
    expect(hidden).toBeInTheDocument();
    expect(hidden.value).toBe("Clínica Saúde");
  });
});
