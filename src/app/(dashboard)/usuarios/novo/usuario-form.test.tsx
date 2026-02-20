import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));
const mockPush = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: () => [formState.current, vi.fn(), formPending.current],
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

vi.mock("../actions", () => ({
  criarUsuario: vi.fn(),
  atualizarUsuario: vi.fn(),
}));

import { UsuarioForm } from "./usuario-form";
import type { UsuarioDefaults } from "../types";

const clinicas = [
  { id: "c-1", nome: "Clínica Alpha" },
  { id: "c-2", nome: "Clínica Beta" },
];

const editDefaults: UsuarioDefaults = {
  vinculo_id: "vinc-1",
  user_id: "user-abc",
  email: "usuario@teste.com",
  papel: "secretaria",
  clinica_id: "clinica-123",
  clinica_nome: "Clínica Alpha",
};

describe("UsuarioForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockPush.mockClear();
    mockToastSuccess.mockClear();
  });

  it("renderiza campo de clínica com opções", () => {
    render(<UsuarioForm clinicas={clinicas} />);
    const select = screen.getByLabelText(/Clínica/) as HTMLSelectElement;
    expect(select).toBeRequired();
    expect(select.querySelectorAll("option")).toHaveLength(2);
  });

  it("renderiza campo de email", () => {
    render(<UsuarioForm clinicas={clinicas} />);
    const input = screen.getByLabelText(/E-mail/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("type", "email");
  });

  it("renderiza campo de senha", () => {
    render(<UsuarioForm clinicas={clinicas} />);
    const input = screen.getByLabelText(/Senha/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("minlength", "8");
    expect(input).toHaveAttribute("maxlength", "128");
  });

  it("renderiza select de papel com 4 opções", () => {
    render(<UsuarioForm clinicas={clinicas} />);
    const select = screen.getByLabelText(/Papel/) as HTMLSelectElement;
    expect(select).toBeRequired();
    expect(select.querySelectorAll("option")).toHaveLength(4);
  });

  it("renderiza botão Criar usuário", () => {
    render(<UsuarioForm clinicas={clinicas} />);
    expect(screen.getByRole("button", { name: /Criar usuário/ })).toBeInTheDocument();
  });

  it("desabilita campos quando pendente", () => {
    formPending.current = true;
    render(<UsuarioForm clinicas={clinicas} />);
    expect(screen.getByRole("button", { name: /Criar usuário/ })).toBeDisabled();
    expect(screen.getByLabelText(/E-mail/)).toBeDisabled();
    expect(screen.getByLabelText(/Senha/)).toBeDisabled();
  });

  it("redireciona para /usuarios no sucesso", () => {
    formState.current = { success: true };
    render(<UsuarioForm clinicas={clinicas} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Usuário criado com sucesso.");
    expect(mockPush).toHaveBeenCalledWith("/configuracoes?tab=usuarios");
  });

  it("exibe mensagem de erro", () => {
    formState.current = { error: "E-mail é obrigatório." };
    render(<UsuarioForm clinicas={clinicas} />);
    expect(screen.getByText("E-mail é obrigatório.")).toBeInTheDocument();
  });
});

describe("UsuarioForm — modo edição", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockPush.mockClear();
    mockToastSuccess.mockClear();
  });

  it("exibe email como texto readonly", () => {
    render(<UsuarioForm clinicas={[]} defaults={editDefaults} />);
    expect(screen.getByText("usuario@teste.com")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /E-mail/ })).not.toBeInTheDocument();
  });

  it("exibe clínica como texto readonly", () => {
    render(<UsuarioForm clinicas={[]} defaults={editDefaults} />);
    expect(screen.getByText("Clínica Alpha")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Clínica/ })).not.toBeInTheDocument();
  });

  it("não exibe campo de senha", () => {
    render(<UsuarioForm clinicas={[]} defaults={editDefaults} />);
    expect(screen.queryByLabelText(/Senha/)).not.toBeInTheDocument();
  });

  it("exibe select de papel com valor default", () => {
    render(<UsuarioForm clinicas={[]} defaults={editDefaults} />);
    const select = screen.getByLabelText(/Papel/) as HTMLSelectElement;
    expect(select.value).toBe("secretaria");
  });

  it("renderiza botão Salvar alterações", () => {
    render(<UsuarioForm clinicas={[]} defaults={editDefaults} />);
    expect(screen.getByRole("button", { name: /Salvar alterações/ })).toBeInTheDocument();
  });

  it("redireciona com toast de atualização no sucesso", () => {
    formState.current = { success: true };
    render(<UsuarioForm clinicas={[]} defaults={editDefaults} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Usuário atualizado com sucesso.");
    expect(mockPush).toHaveBeenCalledWith("/configuracoes?tab=usuarios");
  });
});
