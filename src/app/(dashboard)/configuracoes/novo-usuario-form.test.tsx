import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: () => [formState.current, vi.fn(), formPending.current],
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: vi.fn(),
  },
}));

vi.mock("@/app/(dashboard)/usuarios/actions", () => ({
  criarUsuario: vi.fn(),
}));

import { NovoUsuarioForm } from "./novo-usuario-form";

const clinicas = [
  { id: "c-1", nome: "Clínica Alpha" },
  { id: "c-2", nome: "Clínica Beta" },
];

describe("NovoUsuarioForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  // --- Toggle behavior ---

  it("começa fechado com botão 'Adicionar'", () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    expect(screen.getByText("Adicionar")).toBeInTheDocument();
    expect(screen.queryByLabelText(/E-mail/)).not.toBeInTheDocument();
  });

  it("abre formulário ao clicar 'Adicionar'", async () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument();
  });

  it("fecha formulário ao clicar 'Cancelar'", async () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument();
    await userEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByLabelText(/E-mail/)).not.toBeInTheDocument();
    expect(screen.getByText("Adicionar")).toBeInTheDocument();
  });

  // --- Form fields ---

  it("renderiza título 'Novo usuário'", () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    expect(screen.getByText("Novo usuário")).toBeInTheDocument();
  });

  it("renderiza select de clínica com opções", async () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    const select = screen.getByLabelText(/Clínica/) as HTMLSelectElement;
    expect(select).toBeRequired();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toBe("Clínica Alpha");
    expect(options[1].textContent).toBe("Clínica Beta");
  });

  it("renderiza campo de email", async () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    const input = screen.getByLabelText(/E-mail/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("type", "email");
  });

  it("renderiza campo de senha", async () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    const input = screen.getByLabelText(/Senha/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("type", "password");
  });

  it("renderiza select de papel com opções", async () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    const select = screen.getByLabelText(/Papel/) as HTMLSelectElement;
    expect(select).toBeRequired();
    const options = select.querySelectorAll("option");
    expect(options.length).toBeGreaterThanOrEqual(4);
    const labels = Array.from(options).map(o => o.textContent);
    expect(labels).toContain("Secretária");
    expect(labels).toContain("Gestor");
  });

  it("renderiza botão 'Criar usuário'", async () => {
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    expect(screen.getByRole("button", { name: /Criar usuário/ })).toBeInTheDocument();
  });

  // --- Success ---

  it("chama toast.success quando state.success é true", async () => {
    formState.current = { success: true };
    render(<NovoUsuarioForm clinicas={clinicas} />);
    // Open to mount InnerForm which triggers useEffect with state.success
    await userEvent.click(screen.getByText("Adicionar"));
    expect(mockToastSuccess).toHaveBeenCalledWith("Usuário criado com sucesso.");
  });

  // --- Error display ---

  it("exibe mensagem de erro geral", async () => {
    formState.current = { error: "E-mail é obrigatório." };
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    expect(screen.getByText("E-mail é obrigatório.")).toBeInTheDocument();
  });

  // --- Pending state ---

  it("desabilita campos quando pendente", async () => {
    formPending.current = true;
    render(<NovoUsuarioForm clinicas={clinicas} />);
    await userEvent.click(screen.getByText("Adicionar"));
    expect(screen.getByLabelText(/E-mail/)).toBeDisabled();
    expect(screen.getByLabelText(/Senha/)).toBeDisabled();
    expect(screen.getByLabelText(/Clínica/)).toBeDisabled();
    expect(screen.getByLabelText(/Papel/)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Criar usuário/ })).toBeDisabled();
  });
});
