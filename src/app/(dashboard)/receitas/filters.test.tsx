import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(""),
}));

import { ReceitaFilters } from "./filters";

describe("ReceitaFilters", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza select com todas as opções de tipo", () => {
    render(<ReceitaFilters currentTipo="" />);
    const select = screen.getByLabelText("Filtrar por tipo");
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(3); // Todos os tipos + 2 tipos
  });

  it("seleciona valor correto baseado em currentTipo", () => {
    render(<ReceitaFilters currentTipo="controle_especial" />);
    const select = screen.getByLabelText("Filtrar por tipo") as HTMLSelectElement;
    expect(select.value).toBe("controle_especial");
  });

  it("navega ao selecionar um tipo", async () => {
    render(<ReceitaFilters currentTipo="" />);
    const select = screen.getByLabelText("Filtrar por tipo");
    await userEvent.selectOptions(select, "controle_especial");
    expect(mockReplace).toHaveBeenCalledWith("/receitas?tipo=controle_especial");
  });

  it("remove filtro ao selecionar 'Todos os tipos'", async () => {
    render(<ReceitaFilters currentTipo="simples" />);
    const select = screen.getByLabelText("Filtrar por tipo");
    await userEvent.selectOptions(select, "");
    expect(mockReplace).toHaveBeenCalledWith("/receitas?");
  });
});
