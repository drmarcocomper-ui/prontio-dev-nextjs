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

const { mockToastSuccess } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: vi.fn() },
}));

import { StatusSelect } from "./status-select";

describe("StatusSelect", () => {
  beforeEach(() => {
    mockAtualizarStatus.mockClear();
    mockRefresh.mockClear();
    mockToastSuccess.mockClear();
  });

  it("renderiza um select com o status atual", () => {
    render(<StatusSelect agendamentoId="ag-1" currentStatus="agendado" />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("agendado");
  });

  it("renderiza todas as opções de status", () => {
    render(<StatusSelect agendamentoId="ag-1" currentStatus="agendado" />);
    expect(screen.getByText("Agendado")).toBeInTheDocument();
    expect(screen.getByText("Confirmado")).toBeInTheDocument();
    expect(screen.getByText("Em atendimento")).toBeInTheDocument();
    expect(screen.getByText("Atendido")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(screen.getByText("Faltou")).toBeInTheDocument();
  });

  it("chama atualizarStatusAgendamento ao mudar status", async () => {
    render(<StatusSelect agendamentoId="ag-1" currentStatus="agendado" />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "confirmado");
    expect(mockAtualizarStatus).toHaveBeenCalledWith("ag-1", "confirmado");
  });
});
