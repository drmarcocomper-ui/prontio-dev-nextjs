import { render, screen } from "@testing-library/react";
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

  it("renderiza o campo de busca com placeholder", () => {
    render(<SearchInput />);
    expect(
      screen.getByPlaceholderText("Buscar por nome, CPF ou telefone...")
    ).toBeInTheDocument();
  });

  it("renderiza com valor padrão quando fornecido", () => {
    render(<SearchInput defaultValue="Maria" />);
    const input = screen.getByPlaceholderText("Buscar por nome, CPF ou telefone...");
    expect(input).toHaveValue("Maria");
  });

  it("chama router.replace com termo de busca ao digitar", async () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText("Buscar por nome, CPF ou telefone...");
    await userEvent.type(input, "João");
    expect(mockReplace).toHaveBeenLastCalledWith(
      expect.stringContaining("q=Jo%C3%A3o")
    );
  });

  it("remove param q quando campo é limpo", async () => {
    render(<SearchInput defaultValue="Maria" />);
    const input = screen.getByPlaceholderText("Buscar por nome, CPF ou telefone...");
    await userEvent.clear(input);
    expect(mockReplace).toHaveBeenLastCalledWith("/pacientes?");
  });

  it("renderiza o ícone de busca", () => {
    render(<SearchInput />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
