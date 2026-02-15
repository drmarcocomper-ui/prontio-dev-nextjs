import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(""),
}));

import { ProntuarioFilters } from "./filters";

const defaultProps = {
  currentTipo: "",
  currentDe: "",
  currentAte: "",
  pacienteId: "",
  pacienteNome: "",
};

describe("ProntuarioFilters", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza select de tipo com todas as opções", () => {
    render(<ProntuarioFilters {...defaultProps} />);
    const select = screen.getByLabelText("Filtrar por tipo");
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(6); // Todos os tipos + 5 tipos
  });

  it("renderiza inputs de data", () => {
    render(<ProntuarioFilters {...defaultProps} />);
    expect(screen.getByLabelText("Data início")).toBeInTheDocument();
    expect(screen.getByLabelText("Data fim")).toBeInTheDocument();
  });

  it("renderiza atalhos de período", () => {
    render(<ProntuarioFilters {...defaultProps} />);
    expect(screen.getByText("Hoje")).toBeInTheDocument();
    expect(screen.getByText("7 dias")).toBeInTheDocument();
    expect(screen.getByText("Este mês")).toBeInTheDocument();
  });

  it("navega ao selecionar um tipo", async () => {
    render(<ProntuarioFilters {...defaultProps} />);
    const select = screen.getByLabelText("Filtrar por tipo");
    await userEvent.selectOptions(select, "consulta");
    expect(mockReplace).toHaveBeenCalledWith("/prontuarios?tipo=consulta");
  });

  it("exibe badge do paciente quando pacienteId e pacienteNome são passados", () => {
    render(
      <ProntuarioFilters
        {...defaultProps}
        pacienteId="abc-123"
        pacienteNome="João Silva"
      />
    );
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("não exibe badge quando pacienteId está vazio", () => {
    render(
      <ProntuarioFilters
        {...defaultProps}
        pacienteId=""
        pacienteNome="João Silva"
      />
    );
    expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
  });

  it("remove filtro de paciente ao clicar no X do badge", async () => {
    render(
      <ProntuarioFilters
        {...defaultProps}
        pacienteId="abc-123"
        pacienteNome="João Silva"
      />
    );
    const removeButton = screen.getByLabelText("Remover filtro por João Silva");
    await userEvent.click(removeButton);
    expect(mockReplace).toHaveBeenCalledWith("/prontuarios?");
  });
});
