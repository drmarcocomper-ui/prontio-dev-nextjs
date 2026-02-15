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

describe("AgendaFilters", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza select de status com todas as opções", () => {
    render(<AgendaFilters currentStatus="" currentTipo="" />);
    const select = screen.getByLabelText("Filtrar por status");
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(7); // Todos os status + 6 status
  });

  it("renderiza select de tipo com todas as opções", () => {
    render(<AgendaFilters currentStatus="" currentTipo="" />);
    const select = screen.getByLabelText("Filtrar por tipo");
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(3); // Todos os tipos + 2 tipos
  });

  it("seleciona status correto baseado em currentStatus", () => {
    render(<AgendaFilters currentStatus="confirmado" currentTipo="" />);
    const select = screen.getByLabelText("Filtrar por status") as HTMLSelectElement;
    expect(select.value).toBe("confirmado");
  });

  it("seleciona tipo correto baseado em currentTipo", () => {
    render(<AgendaFilters currentStatus="" currentTipo="retorno" />);
    const select = screen.getByLabelText("Filtrar por tipo") as HTMLSelectElement;
    expect(select.value).toBe("retorno");
  });

  it("navega ao selecionar um status", async () => {
    render(<AgendaFilters currentStatus="" currentTipo="" />);
    const select = screen.getByLabelText("Filtrar por status");
    await userEvent.selectOptions(select, "confirmado");
    expect(mockReplace).toHaveBeenCalledWith("/agenda?status=confirmado");
  });

  it("navega ao selecionar um tipo", async () => {
    render(<AgendaFilters currentStatus="" currentTipo="" />);
    const select = screen.getByLabelText("Filtrar por tipo");
    await userEvent.selectOptions(select, "retorno");
    expect(mockReplace).toHaveBeenCalledWith("/agenda?tipo=retorno");
  });

  it("remove filtro ao selecionar 'Todos os status'", async () => {
    render(<AgendaFilters currentStatus="agendado" currentTipo="" />);
    const select = screen.getByLabelText("Filtrar por status");
    await userEvent.selectOptions(select, "");
    expect(mockReplace).toHaveBeenCalledWith("/agenda?");
  });
});
