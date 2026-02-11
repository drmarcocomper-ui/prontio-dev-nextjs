import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { MonthFilter } from "./month-filter";

describe("MonthFilter", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza o input de mês com valor correto", () => {
    render(<MonthFilter currentMonth="2024-06" />);
    const input = document.querySelector('input[type="month"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("2024-06");
  });

  it("chama router.replace ao mudar mês", () => {
    render(<MonthFilter currentMonth="2024-06" />);
    const input = document.querySelector('input[type="month"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2024-08" } });
    expect(mockReplace).toHaveBeenCalled();
  });

  it("inclui mes no URL ao mudar", () => {
    render(<MonthFilter currentMonth="2024-06" />);
    const input = document.querySelector('input[type="month"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2024-08" } });
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("mes=2024-08"));
  });
});
