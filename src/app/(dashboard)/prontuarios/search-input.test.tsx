import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { SearchInput } from "@/components/search-input";

describe("SearchInput (prontuarios)", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza o input com placeholder", () => {
    render(<SearchInput basePath="/prontuarios" placeholder="Buscar por paciente ou CID..." ariaLabel="Buscar prontuários" />);
    expect(screen.getByPlaceholderText("Buscar por paciente ou CID...")).toBeInTheDocument();
  });

  it("renderiza com valor padrão quando fornecido", () => {
    render(<SearchInput basePath="/prontuarios" placeholder="Buscar por paciente ou CID..." ariaLabel="Buscar prontuários" defaultValue="Maria" />);
    expect(screen.getByDisplayValue("Maria")).toBeInTheDocument();
  });

  it("chama router.replace ao digitar", async () => {
    render(<SearchInput basePath="/prontuarios" placeholder="Buscar por paciente ou CID..." ariaLabel="Buscar prontuários" />);
    const input = screen.getByPlaceholderText("Buscar por paciente ou CID...");
    await userEvent.type(input, "teste");
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("q=teste"));
    }, { timeout: 1000 });
  });

  it("remove o param q ao limpar o input", async () => {
    render(<SearchInput basePath="/prontuarios" placeholder="Buscar por paciente ou CID..." ariaLabel="Buscar prontuários" defaultValue="x" />);
    const input = screen.getByPlaceholderText("Buscar por paciente ou CID...");
    await userEvent.clear(input);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/prontuarios?");
    }, { timeout: 1000 });
  });

  it("renderiza ícone de busca", () => {
    render(<SearchInput basePath="/prontuarios" placeholder="Buscar por paciente ou CID..." ariaLabel="Buscar prontuários" />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
