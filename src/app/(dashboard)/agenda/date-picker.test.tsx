import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/date", () => ({
  todayLocal: () => "2024-06-15",
  toDateString: (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  parseLocalDate: (s: string) => new Date(s + "T12:00:00"),
}));

import { DatePicker } from "./date-picker";

describe("DatePicker", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renderiza os botões de navegação", () => {
    render(<DatePicker currentDate="2024-06-15" />);
    expect(screen.getByLabelText("Dia anterior")).toBeInTheDocument();
    expect(screen.getByLabelText("Próximo dia")).toBeInTheDocument();
    expect(screen.getByText("Hoje")).toBeInTheDocument();
  });

  it("renderiza o input de data com valor correto", () => {
    render(<DatePicker currentDate="2024-06-15" />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("2024-06-15");
  });

  it("renderiza a data formatada em pt-BR", () => {
    render(<DatePicker currentDate="2024-06-15" />);
    expect(screen.getByText(/15 de junho de 2024/)).toBeInTheDocument();
  });

  it("navega para o dia anterior ao clicar", async () => {
    render(<DatePicker currentDate="2024-06-15" />);
    await userEvent.click(screen.getByLabelText("Dia anterior"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("data=2024-06-14"));
  });

  it("navega para o próximo dia ao clicar", async () => {
    render(<DatePicker currentDate="2024-06-15" />);
    await userEvent.click(screen.getByLabelText("Próximo dia"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("data=2024-06-16"));
  });

  it("desabilita botão Hoje quando já é hoje", () => {
    render(<DatePicker currentDate="2024-06-15" />);
    expect(screen.getByText("Hoje")).toBeDisabled();
  });

  it("habilita botão Hoje quando não é hoje", () => {
    render(<DatePicker currentDate="2024-01-01" />);
    expect(screen.getByText("Hoje")).not.toBeDisabled();
  });

  it("navega para hoje ao clicar no botão Hoje", async () => {
    render(<DatePicker currentDate="2024-01-01" />);
    await userEvent.click(screen.getByText("Hoje"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("data=2024-06-15"));
  });

  it("navega ao alterar o input de data", () => {
    render(<DatePicker currentDate="2024-06-15" />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2024-07-20" } });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("data=2024-07-20"));
  });

  it("não navega quando input de data é limpo", () => {
    render(<DatePicker currentDate="2024-06-15" />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
