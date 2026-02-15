import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(""),
}));

import { PacienteFilters } from "./filters";

describe("PacienteFilters", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza select com todas as opções de sexo", () => {
    render(<PacienteFilters currentSexo="" />);
    const select = screen.getByLabelText("Filtrar por sexo");
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(4); // Todos os sexos + 3 opções
  });

  it("seleciona valor correto baseado em currentSexo", () => {
    render(<PacienteFilters currentSexo="feminino" />);
    const select = screen.getByLabelText("Filtrar por sexo") as HTMLSelectElement;
    expect(select.value).toBe("feminino");
  });

  it("navega ao selecionar um sexo", async () => {
    render(<PacienteFilters currentSexo="" />);
    const select = screen.getByLabelText("Filtrar por sexo");
    await userEvent.selectOptions(select, "masculino");
    expect(mockReplace).toHaveBeenCalledWith("/pacientes?sexo=masculino");
  });

  it("remove filtro ao selecionar 'Todos os sexos'", async () => {
    render(<PacienteFilters currentSexo="feminino" />);
    const select = screen.getByLabelText("Filtrar por sexo");
    await userEvent.selectOptions(select, "");
    expect(mockReplace).toHaveBeenCalledWith("/pacientes?");
  });
});
