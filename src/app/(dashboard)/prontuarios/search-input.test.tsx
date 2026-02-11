import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { SearchInput } from "./search-input";

describe("SearchInput (prontuarios)", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renderiza o input com placeholder", () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText("Buscar por paciente ou CID...")).toBeInTheDocument();
  });

  it("renderiza com valor padrão quando fornecido", () => {
    render(<SearchInput defaultValue="Maria" />);
    expect(screen.getByDisplayValue("Maria")).toBeInTheDocument();
  });

  it("chama router.replace ao digitar", async () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText("Buscar por paciente ou CID...");
    await userEvent.type(input, "teste");
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("q=teste"));
  });

  it("remove o param q ao limpar o input", async () => {
    render(<SearchInput defaultValue="x" />);
    const input = screen.getByPlaceholderText("Buscar por paciente ou CID...");
    await userEvent.clear(input);
    expect(mockReplace).toHaveBeenCalledWith("/prontuarios?");
  });

  it("renderiza ícone de busca", () => {
    render(<SearchInput />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
