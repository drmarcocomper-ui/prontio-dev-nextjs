import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { SearchInput } from "@/components/search-input";

describe("SearchInput", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza o campo de busca com placeholder", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar por nome, CPF ou telefone..." ariaLabel="Buscar pacientes" />);
    expect(
      screen.getByPlaceholderText("Buscar por nome, CPF ou telefone...")
    ).toBeInTheDocument();
  });

  it("renderiza com valor padrão quando fornecido", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar por nome, CPF ou telefone..." ariaLabel="Buscar pacientes" defaultValue="Maria" />);
    const input = screen.getByPlaceholderText("Buscar por nome, CPF ou telefone...");
    expect(input).toHaveValue("Maria");
  });

  it("chama router.replace com termo de busca ao digitar", async () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar por nome, CPF ou telefone..." ariaLabel="Buscar pacientes" />);
    const input = screen.getByPlaceholderText("Buscar por nome, CPF ou telefone...");
    await userEvent.type(input, "João");
    await waitFor(() => {
      expect(mockReplace).toHaveBeenLastCalledWith(
        expect.stringContaining("q=Jo%C3%A3o")
      );
    }, { timeout: 1000 });
  });

  it("remove param q quando campo é limpo", async () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar por nome, CPF ou telefone..." ariaLabel="Buscar pacientes" defaultValue="Maria" />);
    const input = screen.getByPlaceholderText("Buscar por nome, CPF ou telefone...");
    await userEvent.clear(input);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenLastCalledWith("/pacientes?");
    }, { timeout: 1000 });
  });

  it("renderiza o ícone de busca", () => {
    render(<SearchInput basePath="/pacientes" placeholder="Buscar por nome, CPF ou telefone..." ariaLabel="Buscar pacientes" />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
