import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExcluirReceita = vi.fn();

vi.mock("../actions", () => ({
  excluirReceita: (...args: unknown[]) => mockExcluirReceita(...args),
}));

import { DeleteButton } from "./delete-button";

describe("DeleteButton (receita)", () => {
  beforeEach(() => {
    mockExcluirReceita.mockClear();
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteButton receitaId="rec-1" />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("abre o modal ao clicar", async () => {
    render(<DeleteButton receitaId="rec-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir receita")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama excluirReceita ao confirmar", async () => {
    render(<DeleteButton receitaId="rec-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const buttons = screen.getAllByRole("button", { name: "Excluir" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(mockExcluirReceita).toHaveBeenCalledWith("rec-1");
  });
});
