import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExcluirProntuario = vi.fn();

vi.mock("../actions", () => ({
  excluirProntuario: (...args: unknown[]) => mockExcluirProntuario(...args),
}));

import { DeleteButton } from "./delete-button";

describe("DeleteButton (prontuário)", () => {
  beforeEach(() => {
    mockExcluirProntuario.mockClear();
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteButton prontuarioId="pr-1" />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("abre o modal ao clicar", async () => {
    render(<DeleteButton prontuarioId="pr-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir prontuário")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza que deseja excluir este prontuário? Esta ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama excluirProntuario ao confirmar", async () => {
    render(<DeleteButton prontuarioId="pr-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const buttons = screen.getAllByRole("button", { name: "Excluir" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(mockExcluirProntuario).toHaveBeenCalledWith("pr-1");
  });
});
