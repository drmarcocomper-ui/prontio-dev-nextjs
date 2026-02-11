import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExcluirTransacao = vi.fn();

vi.mock("./actions", () => ({
  excluirTransacao: (...args: unknown[]) => mockExcluirTransacao(...args),
}));

import { DeleteButton } from "./delete-button";

describe("DeleteButton (financeiro)", () => {
  beforeEach(() => {
    mockExcluirTransacao.mockClear();
  });

  it("renderiza o botão com título Excluir", () => {
    render(<DeleteButton transacaoId="t-1" />);
    expect(screen.getByTitle("Excluir")).toBeInTheDocument();
  });

  it("abre o modal ao clicar", async () => {
    render(<DeleteButton transacaoId="t-1" />);
    await userEvent.click(screen.getByTitle("Excluir"));
    expect(screen.getByText("Excluir transação")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama excluirTransacao ao confirmar", async () => {
    render(<DeleteButton transacaoId="t-1" />);
    await userEvent.click(screen.getByTitle("Excluir"));
    await userEvent.click(screen.getByText("Excluir"));
    expect(mockExcluirTransacao).toHaveBeenCalledWith("t-1");
  });
});
