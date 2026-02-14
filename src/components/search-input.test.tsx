import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { SearchInput } from "./search-input";

describe("SearchInput", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza o input com placeholder", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar paciente..." ariaLabel="Buscar pacientes" />);
    expect(screen.getByPlaceholderText("Buscar paciente...")).toBeInTheDocument();
  });

  it("renderiza o input com aria-label", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar..." ariaLabel="Buscar pacientes" />);
    expect(screen.getByLabelText("Buscar pacientes")).toBeInTheDocument();
  });

  it("renderiza com valor default", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar..." ariaLabel="Buscar" defaultValue="João" />);
    expect(screen.getByDisplayValue("João")).toBeInTheDocument();
  });

  it("navega após debounce de 300ms", async () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar..." ariaLabel="Buscar" />);
    const input = screen.getByLabelText("Buscar");
    await userEvent.type(input, "teste");
    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("q=teste"));
      },
      { timeout: 1000 }
    );
  });

  it("inclui basePath na URL de navegação", async () => {
    render(<SearchInput basePath="/prontuarios" placeholder="Buscar..." ariaLabel="Buscar" />);
    const input = screen.getByLabelText("Buscar");
    await userEvent.type(input, "CID");
    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/prontuarios\?/));
      },
      { timeout: 1000 }
    );
  });

  it("remove parâmetro pagina ao buscar", async () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar..." ariaLabel="Buscar" />);
    const input = screen.getByLabelText("Buscar");
    await userEvent.type(input, "x");
    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalled();
        const url = mockReplace.mock.calls[0][0] as string;
        expect(url).not.toContain("pagina=");
      },
      { timeout: 1000 }
    );
  });

  it("mostra botão Limpar quando há valor", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar..." ariaLabel="Buscar" defaultValue="abc" />);
    expect(screen.getByLabelText("Limpar busca")).toBeInTheDocument();
  });

  it("não mostra botão Limpar quando vazio", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar..." ariaLabel="Buscar" />);
    expect(screen.queryByLabelText("Limpar busca")).not.toBeInTheDocument();
  });

  it("limpa o input ao clicar em Limpar", async () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar..." ariaLabel="Buscar" defaultValue="abc" />);
    await userEvent.click(screen.getByLabelText("Limpar busca"));
    expect(screen.getByLabelText("Buscar")).toHaveValue("");
  });

  it("tem maxLength 100", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar..." ariaLabel="Buscar" />);
    expect(screen.getByLabelText("Buscar")).toHaveAttribute("maxLength", "100");
  });
});
