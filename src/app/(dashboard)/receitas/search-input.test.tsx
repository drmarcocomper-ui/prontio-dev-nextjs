import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { SearchInput } from "@/components/search-input";

describe("SearchInput (receitas)", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza o input com placeholder", () => {
    render(<SearchInput basePath="/receitas" placeholder="Buscar por paciente ou medicamento..." ariaLabel="Buscar receitas" />);
    expect(screen.getByPlaceholderText("Buscar por paciente ou medicamento...")).toBeInTheDocument();
  });

  it("renderiza com valor padrão quando fornecido", () => {
    render(<SearchInput basePath="/receitas" placeholder="Buscar por paciente ou medicamento..." ariaLabel="Buscar receitas" defaultValue="Maria" />);
    expect(screen.getByDisplayValue("Maria")).toBeInTheDocument();
  });

  it("chama router.replace ao digitar", async () => {
    render(<SearchInput basePath="/receitas" placeholder="Buscar por paciente ou medicamento..." ariaLabel="Buscar receitas" />);
    const input = screen.getByPlaceholderText("Buscar por paciente ou medicamento...");
    await userEvent.type(input, "teste");
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("q=teste"));
    }, { timeout: 1000 });
  });

  it("remove o param q ao limpar o input", async () => {
    render(<SearchInput basePath="/receitas" placeholder="Buscar por paciente ou medicamento..." ariaLabel="Buscar receitas" defaultValue="x" />);
    const input = screen.getByPlaceholderText("Buscar por paciente ou medicamento...");
    await userEvent.clear(input);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/receitas?");
    }, { timeout: 1000 });
  });

  it("renderiza ícone de busca", () => {
    render(<SearchInput basePath="/receitas" placeholder="Buscar por paciente ou medicamento..." ariaLabel="Buscar receitas" />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
