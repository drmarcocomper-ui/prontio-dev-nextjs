import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

import { DatePicker } from "./date-picker";

describe("DatePicker", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renderiza os botões de navegação", () => {
    render(<DatePicker currentDate="2024-06-15" />);
    expect(screen.getByTitle("Dia anterior")).toBeInTheDocument();
    expect(screen.getByTitle("Próximo dia")).toBeInTheDocument();
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
    await userEvent.click(screen.getByTitle("Dia anterior"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("data=2024-06-14"));
  });

  it("navega para o próximo dia ao clicar", async () => {
    render(<DatePicker currentDate="2024-06-15" />);
    await userEvent.click(screen.getByTitle("Próximo dia"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("data=2024-06-16"));
  });

  it("desabilita botão Hoje quando já é hoje", () => {
    const today = new Date().toISOString().split("T")[0];
    render(<DatePicker currentDate={today} />);
    expect(screen.getByText("Hoje")).toBeDisabled();
  });

  it("habilita botão Hoje quando não é hoje", () => {
    render(<DatePicker currentDate="2024-01-01" />);
    expect(screen.getByText("Hoje")).not.toBeDisabled();
  });
});
