import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { SortSelect } from "./sort-select";

const options = [
  { label: "Data (mais recente)", column: "data", direction: "desc" as const },
  { label: "Data (mais antiga)", column: "data", direction: "asc" as const },
  { label: "Nome (A-Z)", column: "nome", direction: "asc" as const },
  { label: "Nome (Z-A)", column: "nome", direction: "desc" as const },
];

describe("SortSelect", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza o label 'Ordenar por:'", () => {
    render(
      <SortSelect options={options} currentColumn="data" currentDirection="desc" basePath="/pacientes" />
    );
    expect(screen.getByText("Ordenar por:")).toBeInTheDocument();
  });

  it("renderiza todas as opções", () => {
    render(
      <SortSelect options={options} currentColumn="data" currentDirection="desc" basePath="/pacientes" />
    );
    const select = screen.getByLabelText("Ordenar por:");
    expect(select.querySelectorAll("option")).toHaveLength(4);
  });

  it("seleciona a opção atual baseada em column:direction", () => {
    render(
      <SortSelect options={options} currentColumn="nome" currentDirection="asc" basePath="/pacientes" />
    );
    const select = screen.getByLabelText("Ordenar por:") as HTMLSelectElement;
    expect(select.value).toBe("nome:asc");
  });

  it("navega ao alterar a seleção", async () => {
    render(
      <SortSelect options={options} currentColumn="data" currentDirection="desc" basePath="/pacientes" />
    );
    const select = screen.getByLabelText("Ordenar por:");
    await userEvent.selectOptions(select, "nome:asc");
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringMatching(/^\/pacientes\?/)
    );
    const url = mockReplace.mock.calls[0][0] as string;
    expect(url).toContain("ordem=nome");
    expect(url).toContain("dir=asc");
  });

  it("remove pagina ao alterar a seleção", async () => {
    render(
      <SortSelect options={options} currentColumn="data" currentDirection="desc" basePath="/pacientes" />
    );
    const select = screen.getByLabelText("Ordenar por:");
    await userEvent.selectOptions(select, "data:asc");
    const url = mockReplace.mock.calls[0][0] as string;
    expect(url).not.toContain("pagina=");
  });

  it("inclui basePath na URL", async () => {
    render(
      <SortSelect options={options} currentColumn="data" currentDirection="desc" basePath="/prontuarios" />
    );
    const select = screen.getByLabelText("Ordenar por:");
    await userEvent.selectOptions(select, "nome:desc");
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringMatching(/^\/prontuarios\?/)
    );
  });
});
