import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UsuarioListItem } from "./types";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockRemoverVinculo = vi.hoisted(() => vi.fn());

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
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("./actions", () => ({
  atualizarPapel: vi.fn(),
  resetarSenha: vi.fn(),
  removerVinculo: mockRemoverVinculo,
}));

import { UsuarioRowActions } from "./usuario-actions";

const baseUsuario: UsuarioListItem = {
  vinculo_id: "v-1",
  user_id: "u-1",
  email: "user@test.com",
  papel: "secretaria",
  clinica_id: "c-1",
  clinica_nome: "Clínica Teste",
  created_at: "2024-01-01T00:00:00Z",
};

describe("UsuarioRowActions", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    mockRemoverVinculo.mockClear();
  });

  it("mostra badge 'Você' quando isSelf é true", () => {
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={true} />);
    expect(screen.getByText("Você")).toBeInTheDocument();
    expect(screen.queryByLabelText("Alterar papel")).not.toBeInTheDocument();
  });

  it("mostra ações quando isSelf é false", () => {
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    expect(screen.queryByText("Você")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Alterar papel")).toBeInTheDocument();
    expect(screen.getByLabelText("Resetar senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Excluir")).toBeInTheDocument();
  });

  // --- PapelSelect ---

  it("renderiza select de papel com valor correto", () => {
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    const select = screen.getByLabelText("Alterar papel") as HTMLSelectElement;
    expect(select.value).toBe("secretaria");
  });

  it("desabilita select quando papel é superadmin", () => {
    const superadminUser = { ...baseUsuario, papel: "superadmin" as const };
    render(<UsuarioRowActions usuario={superadminUser} isSelf={false} />);
    const select = screen.getByLabelText("Alterar papel") as HTMLSelectElement;
    expect(select).toBeDisabled();
  });

  it("inclui opção Superadmin no select quando papel é superadmin", () => {
    const superadminUser = { ...baseUsuario, papel: "superadmin" as const };
    render(<UsuarioRowActions usuario={superadminUser} isSelf={false} />);
    const select = screen.getByLabelText("Alterar papel");
    const options = select.querySelectorAll("option");
    expect(Array.from(options).some(o => o.textContent === "Superadmin")).toBe(true);
  });

  // --- ResetSenhaButton ---

  it("abre modal ao clicar em Resetar senha", async () => {
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    await userEvent.click(screen.getByLabelText("Resetar senha"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Resetar senha")).toBeInTheDocument();
    expect(screen.getByText(/Defina uma nova senha/)).toBeInTheDocument();
  });

  it("mostra email do usuário no modal", async () => {
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    await userEvent.click(screen.getByLabelText("Resetar senha"));
    expect(screen.getByText(/user@test.com/)).toBeInTheDocument();
  });

  it("fecha modal ao clicar Cancelar", async () => {
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    await userEvent.click(screen.getByLabelText("Resetar senha"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza campo de senha no modal", async () => {
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    await userEvent.click(screen.getByLabelText("Resetar senha"));
    const input = screen.getByLabelText("Nova senha");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toBeRequired();
  });

  it("chama toast.success quando resetar senha retorna sucesso", () => {
    formState.current = { success: true };
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Senha resetada com sucesso.");
  });

  it("chama toast.success quando papel é atualizado", () => {
    formState.current = { success: true };
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Papel atualizado.");
  });

  // --- RemoverVinculoButton ---

  it("abre modal de confirmação ao clicar Excluir", async () => {
    render(<UsuarioRowActions usuario={baseUsuario} isSelf={false} />);
    await userEvent.click(screen.getByLabelText("Excluir"));
    expect(screen.getByText("Remover vínculo")).toBeInTheDocument();
    expect(screen.getByText(/perderá acesso/)).toBeInTheDocument();
  });
});
