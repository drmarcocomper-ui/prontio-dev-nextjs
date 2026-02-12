import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const { mockAtualizarStatus } = vi.hoisted(() => ({
  mockAtualizarStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./actions", () => ({
  atualizarStatusAgendamento: mockAtualizarStatus,
}));

vi.mock("./types", async () => {
  const actual = await vi.importActual("./types");
  return { ...actual };
});

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import { StatusSelect } from "./status-select";

describe("StatusSelect", () => {
  beforeEach(() => {
    mockAtualizarStatus.mockClear().mockResolvedValue(undefined);
    mockRefresh.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it("renderiza um select com o status atual", () => {
    render(<StatusSelect agendamentoId="ag-1" currentStatus="agendado" />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("agendado");
  });

  it("mostra apenas as transições permitidas para agendado", () => {
    render(<StatusSelect agendamentoId="ag-1" currentStatus="agendado" />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4); // agendado + confirmado, cancelado, faltou
    expect(screen.getByText("Agendado")).toBeInTheDocument();
    expect(screen.getByText("Confirmado")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(screen.getByText("Faltou")).toBeInTheDocument();
    expect(screen.queryByText("Em atendimento")).not.toBeInTheDocument();
    expect(screen.queryByText("Atendido")).not.toBeInTheDocument();
  });

  it("mostra apenas as transições permitidas para confirmado", () => {
    render(<StatusSelect agendamentoId="ag-1" currentStatus="confirmado" />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4); // confirmado + em_atendimento, cancelado, faltou
    expect(screen.getByText("Confirmado")).toBeInTheDocument();
    expect(screen.getByText("Em atendimento")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(screen.getByText("Faltou")).toBeInTheDocument();
  });

  it("mostra apenas reagendar para cancelado", () => {
    render(<StatusSelect agendamentoId="ag-1" currentStatus="cancelado" />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2); // cancelado + agendado
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(screen.getByText("Agendado")).toBeInTheDocument();
  });

  it("não renderiza select para status terminal (atendido)", () => {
    const { container } = render(
      <StatusSelect agendamentoId="ag-1" currentStatus="atendido" />
    );
    expect(container.innerHTML).toBe("");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("chama atualizarStatusAgendamento ao mudar status", async () => {
    render(<StatusSelect agendamentoId="ag-1" currentStatus="agendado" />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "confirmado");
    expect(mockAtualizarStatus).toHaveBeenCalledWith("ag-1", "confirmado");
  });

  it("mostra toast de erro quando a action falha", async () => {
    mockAtualizarStatus.mockRejectedValueOnce(new Error("Transição de status não permitida."));
    render(<StatusSelect agendamentoId="ag-1" currentStatus="agendado" />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "confirmado");
    expect(mockToastError).toHaveBeenCalledWith("Erro ao atualizar status.");
  });
});
