import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { DeleteButton } from "@/components/delete-button";

const mockOnDelete = vi.fn();

describe("DeleteButton", () => {
  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir paciente" description="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir paciente. Tente novamente." />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("não mostra o modal inicialmente", () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir paciente" description="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir paciente. Tente novamente." />);
    expect(screen.queryByText("Excluir paciente")).not.toBeInTheDocument();
  });

  it("abre o modal ao clicar em Excluir", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir paciente" description="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir paciente. Tente novamente." />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir paciente")).toBeInTheDocument();
    expect(
      screen.getByText("Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.")
    ).toBeInTheDocument();
  });

  it("fecha o modal ao clicar em Cancelar", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir paciente" description="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir paciente. Tente novamente." />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await userEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText("Excluir paciente")).not.toBeInTheDocument();
  });

  it("chama onDelete ao confirmar", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir paciente" description="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir paciente. Tente novamente." />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    // The confirm button inside the modal also says "Excluir"
    const buttons = screen.getAllByRole("button", { name: "Excluir" });
    const confirmButton = buttons[buttons.length - 1];
    await userEvent.click(confirmButton);
    expect(mockOnDelete).toHaveBeenCalled();
  });
});
