import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(""),
}));

import { PapelFilter } from "./filters";

describe("PapelFilter", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza select com todas as opções de papel", () => {
    render(<PapelFilter currentPapel="" />);
    const select = screen.getByLabelText("Filtrar por papel");
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(6); // Todos + 5 papéis
  });

  it("seleciona valor correto baseado em currentPapel", () => {
    render(<PapelFilter currentPapel="gestor" />);
    const select = screen.getByLabelText("Filtrar por papel") as HTMLSelectElement;
    expect(select.value).toBe("gestor");
  });

  it("navega ao selecionar um papel (default basePath)", async () => {
    render(<PapelFilter currentPapel="" />);
    const select = screen.getByLabelText("Filtrar por papel");
    await userEvent.selectOptions(select, "secretaria");
    expect(mockReplace).toHaveBeenCalledWith("/configuracoes?papel=secretaria");
  });

  it("remove filtro ao selecionar 'Todos os papéis'", async () => {
    render(<PapelFilter currentPapel="gestor" />);
    const select = screen.getByLabelText("Filtrar por papel");
    await userEvent.selectOptions(select, "");
    expect(mockReplace).toHaveBeenCalledWith("/configuracoes?");
  });

  it("usa basePath customizado quando fornecido", async () => {
    render(<PapelFilter currentPapel="" basePath="/usuarios" />);
    const select = screen.getByLabelText("Filtrar por papel");
    await userEvent.selectOptions(select, "gestor");
    expect(mockReplace).toHaveBeenCalledWith("/usuarios?papel=gestor");
  });
});
