import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("./types", () => ({
  STATUS_LABELS: {
    agendado: "Agendado",
    confirmado: "Confirmado",
    em_atendimento: "Em atendimento",
    atendido: "Atendido",
    cancelado: "Cancelado",
    faltou: "Faltou",
  },
  TIPO_LABELS: {
    consulta: "Consulta",
    retorno: "Retorno",
  },
}));

import { AgendaFilters } from "./filters";

const defaultProps = {
  currentStatus: "",
  currentTipo: "",
  statusCounts: { agendado: 2, confirmado: 1, em_atendimento: 0, atendido: 0, cancelado: 0, faltou: 0 },
  total: 3,
};

describe("AgendaFilters", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza pill 'Todos' com contagem total", () => {
    render(<AgendaFilters {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    const todosButton = buttons.find((b) => b.textContent?.includes("Todos"));
    expect(todosButton).toBeDefined();
    expect(todosButton?.textContent).toContain("(3)");
  });

  it("renderiza pills apenas para status com contagem > 0", () => {
    render(<AgendaFilters {...defaultProps} />);
    expect(screen.getByText(/Agendado/)).toBeInTheDocument();
    expect(screen.getByText(/Confirmado/)).toBeInTheDocument();
    expect(screen.queryByText(/Em atendimento/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Atendido/)).not.toBeInTheDocument();
  });

  it("renderiza select de tipo com todas as opções", () => {
    render(<AgendaFilters {...defaultProps} />);
    const select = screen.getByLabelText("Filtrar por tipo");
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(3); // Todos os tipos + 2 tipos
  });

  it("seleciona tipo correto baseado em currentTipo", () => {
    render(<AgendaFilters {...defaultProps} currentTipo="retorno" />);
    const select = screen.getByLabelText("Filtrar por tipo") as HTMLSelectElement;
    expect(select.value).toBe("retorno");
  });

  it("navega ao clicar em pill de status", async () => {
    render(<AgendaFilters {...defaultProps} />);
    await userEvent.click(screen.getByText(/Agendado/));
    expect(mockReplace).toHaveBeenCalledWith("/agenda?status=agendado");
  });

  it("navega ao selecionar um tipo", async () => {
    render(<AgendaFilters {...defaultProps} />);
    const select = screen.getByLabelText("Filtrar por tipo");
    await userEvent.selectOptions(select, "retorno");
    expect(mockReplace).toHaveBeenCalledWith("/agenda?tipo=retorno");
  });

  it("remove filtro ao clicar em 'Todos'", async () => {
    render(<AgendaFilters {...defaultProps} currentStatus="agendado" />);
    const buttons = screen.getAllByRole("button");
    const todosButton = buttons.find((b) => b.textContent?.includes("Todos"));
    expect(todosButton).toBeDefined();
    await userEvent.click(todosButton!);
    expect(mockReplace).toHaveBeenCalledWith("/agenda?");
  });
});
