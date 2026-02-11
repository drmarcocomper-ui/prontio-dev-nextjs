import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExcluirTransacao = vi.fn();

vi.mock("../actions", () => ({
  excluirTransacao: (...args: unknown[]) => mockExcluirTransacao(...args),
}));

import { DeleteButton } from "./delete-button";

describe("DeleteButton (transação)", () => {
  beforeEach(() => {
    mockExcluirTransacao.mockClear();
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteButton transacaoId="t-1" />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("abre o modal ao clicar", async () => {
    render(<DeleteButton transacaoId="t-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir transação")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama excluirTransacao ao confirmar", async () => {
    render(<DeleteButton transacaoId="t-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const buttons = screen.getAllByRole("button", { name: "Excluir" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(mockExcluirTransacao).toHaveBeenCalledWith("t-1");
  });
});
