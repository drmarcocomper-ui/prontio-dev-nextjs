import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExcluirPaciente = vi.fn();

vi.mock("../actions", () => ({
  excluirPaciente: (...args: unknown[]) => mockExcluirPaciente(...args),
}));

import { DeleteButton } from "./delete-button";

describe("DeleteButton", () => {
  beforeEach(() => {
    mockExcluirPaciente.mockClear();
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteButton pacienteId="123" />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("não mostra o modal inicialmente", () => {
    render(<DeleteButton pacienteId="123" />);
    expect(screen.queryByText("Excluir paciente")).not.toBeInTheDocument();
  });

  it("abre o modal ao clicar em Excluir", async () => {
    render(<DeleteButton pacienteId="123" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir paciente")).toBeInTheDocument();
    expect(
      screen.getByText("Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.")
    ).toBeInTheDocument();
  });

  it("fecha o modal ao clicar em Cancelar", async () => {
    render(<DeleteButton pacienteId="123" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await userEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText("Excluir paciente")).not.toBeInTheDocument();
  });

  it("chama excluirPaciente com o id ao confirmar", async () => {
    render(<DeleteButton pacienteId="abc-123" />);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    // The confirm button inside the modal also says "Excluir"
    const buttons = screen.getAllByRole("button", { name: "Excluir" });
    const confirmButton = buttons[buttons.length - 1];
    await userEvent.click(confirmButton);
    expect(mockExcluirPaciente).toHaveBeenCalledWith("abc-123");
  });
});
