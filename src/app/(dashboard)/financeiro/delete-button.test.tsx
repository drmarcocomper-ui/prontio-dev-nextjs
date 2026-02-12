import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { DeleteButton } from "@/components/delete-button";

const mockOnDelete = vi.fn();

describe("DeleteButton (financeiro)", () => {
  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it("renderiza o botão com título Excluir", () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir transação" description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir transação. Tente novamente." variant="icon" />);
    expect(screen.getByTitle("Excluir")).toBeInTheDocument();
  });

  it("abre o modal ao clicar", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir transação" description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir transação. Tente novamente." variant="icon" />);
    await userEvent.click(screen.getByTitle("Excluir"));
    expect(screen.getByText("Excluir transação")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama onDelete ao confirmar", async () => {
    render(<DeleteButton onDelete={mockOnDelete} title="Excluir transação" description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." errorMessage="Erro ao excluir transação. Tente novamente." variant="icon" />);
    await userEvent.click(screen.getByTitle("Excluir"));
    await userEvent.click(screen.getByText("Excluir"));
    expect(mockOnDelete).toHaveBeenCalled();
  });
});
