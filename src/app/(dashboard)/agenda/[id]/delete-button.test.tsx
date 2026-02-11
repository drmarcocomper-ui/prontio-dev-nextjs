import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExcluirAgendamento = vi.fn();

vi.mock("../actions", () => ({
  excluirAgendamento: (...args: unknown[]) => mockExcluirAgendamento(...args),
}));

import { DeleteButton } from "./delete-button";

describe("DeleteButton (agendamento)", () => {
  beforeEach(() => {
    mockExcluirAgendamento.mockClear();
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteButton agendamentoId="ag-1" data="2024-06-15" />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("abre o modal ao clicar", async () => {
    render(<DeleteButton agendamentoId="ag-1" data="2024-06-15" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir agendamento")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama excluirAgendamento ao confirmar", async () => {
    render(<DeleteButton agendamentoId="ag-1" data="2024-06-15" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const buttons = screen.getAllByRole("button", { name: "Excluir" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(mockExcluirAgendamento).toHaveBeenCalledWith("ag-1", "2024-06-15");
  });
});
