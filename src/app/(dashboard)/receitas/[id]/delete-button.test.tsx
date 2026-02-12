import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { DeleteButton } from "@/components/delete-button";

const mockOnDelete = vi.fn();

describe("DeleteButton (receita)", () => {
  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir receita" description="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir receita. Tente novamente." />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("abre o modal ao clicar", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir receita" description="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir receita. Tente novamente." />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir receita")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama onDelete ao confirmar", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir receita" description="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir receita. Tente novamente." />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const buttons = screen.getAllByRole("button", { name: "Excluir" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(mockOnDelete).toHaveBeenCalled();
  });
});
