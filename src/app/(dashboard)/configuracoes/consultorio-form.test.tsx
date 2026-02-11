import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  salvarConfiguracoes: vi.fn(),
}));

import { ConsultorioForm } from "./consultorio-form";

const emptyDefaults: Record<string, string> = {};

const filledDefaults: Record<string, string> = {
  nome_consultorio: "Clínica Saúde",
  cnpj: "12345678000100",
  telefone_consultorio: "11987654321",
  endereco_consultorio: "Rua Exemplo, 123",
  cidade_consultorio: "São Paulo",
  estado_consultorio: "SP",
};

describe("ConsultorioForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("renderiza todos os campos", () => {
    render(<ConsultorioForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText(/Nome do consultório/)).toBeInTheDocument();
    expect(screen.getByLabelText("CNPJ")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone")).toBeInTheDocument();
    expect(screen.getByLabelText("Endereço")).toBeInTheDocument();
    expect(screen.getByLabelText("Cidade")).toBeInTheDocument();
    expect(screen.getByLabelText("Estado")).toBeInTheDocument();
  });

  it("campo nome é obrigatório", () => {
    render(<ConsultorioForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText(/Nome do consultório/)).toBeRequired();
  });

  it("preenche valores padrão quando fornecidos", () => {
    render(<ConsultorioForm defaults={filledDefaults} />);
    expect(screen.getByLabelText(/Nome do consultório/)).toHaveValue("Clínica Saúde");
    expect(screen.getByLabelText("Endereço")).toHaveValue("Rua Exemplo, 123");
    expect(screen.getByLabelText("Cidade")).toHaveValue("São Paulo");
    expect(screen.getByLabelText("Estado")).toHaveValue("SP");
  });

  it("renderiza o botão Salvar", () => {
    render(<ConsultorioForm defaults={emptyDefaults} />);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("aplica máscara de CNPJ ao digitar", async () => {
    render(<ConsultorioForm defaults={emptyDefaults} />);
    const input = screen.getByLabelText("CNPJ");
    await userEvent.type(input, "12345678000100");
    expect(input).toHaveValue("12.345.678/0001-00");
  });

  it("aplica máscara de telefone ao digitar", async () => {
    render(<ConsultorioForm defaults={emptyDefaults} />);
    const input = screen.getByLabelText("Telefone");
    await userEvent.type(input, "11987654321");
    expect(input).toHaveValue("(11) 98765-4321");
  });

  it("campo estado tem maxLength 2", () => {
    render(<ConsultorioForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText("Estado")).toHaveAttribute("maxlength", "2");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar configurações. Tente novamente." };
    render(<ConsultorioForm defaults={emptyDefaults} />);
    expect(screen.getByText("Erro ao salvar configurações. Tente novamente.")).toBeInTheDocument();
  });

  it("chama toast.success quando state.success é true", () => {
    formState.current = { success: true };
    render(<ConsultorioForm defaults={emptyDefaults} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Configurações salvas com sucesso.");
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<ConsultorioForm defaults={emptyDefaults} />);
    const button = screen.getByRole("button", { name: /Salvar/ });
    expect(button).toBeDisabled();
  });
});
