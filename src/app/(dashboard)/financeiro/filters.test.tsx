import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { Filters } from "./filters";

describe("Filters", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza o input de mês com valor correto", () => {
    render(<Filters currentMonth="2024-06" currentType="" />);
    const input = document.querySelector('input[type="month"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("2024-06");
  });

  it("renderiza o select de tipo com opções", () => {
    render(<Filters currentMonth="2024-06" currentType="" />);
    expect(screen.getByText("Todos os tipos")).toBeInTheDocument();
    expect(screen.getByText("Receitas")).toBeInTheDocument();
    expect(screen.getByText("Despesas")).toBeInTheDocument();
  });

  it("chama router.replace ao mudar tipo", async () => {
    render(<Filters currentMonth="2024-06" currentType="" />);
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "receita");
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("tipo=receita"));
  });

  it("remove parâmetro quando valor é vazio", async () => {
    render(<Filters currentMonth="2024-06" currentType="receita" />);
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "");
    expect(mockReplace).toHaveBeenCalledWith(expect.not.stringContaining("tipo="));
  });

  it("chama router.replace ao mudar mês", async () => {
    render(<Filters currentMonth="2024-06" currentType="" />);
    const input = document.querySelector('input[type="month"]') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "2024-07");
    expect(mockReplace).toHaveBeenCalled();
  });
});
