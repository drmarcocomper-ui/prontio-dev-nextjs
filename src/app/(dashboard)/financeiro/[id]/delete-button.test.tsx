import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { DeleteButton } from "@/components/delete-button";

const mockOnDelete = vi.fn();

describe("DeleteButton (transação)", () => {
  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir transação" description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir transação. Tente novamente." />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("abre o modal ao clicar", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir transação" description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir transação. Tente novamente." />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir transação")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama onDelete ao confirmar", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir transação" description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir transação. Tente novamente." />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const buttons = screen.getAllByRole("button", { name: "Excluir" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(mockOnDelete).toHaveBeenCalled();
  });
});
