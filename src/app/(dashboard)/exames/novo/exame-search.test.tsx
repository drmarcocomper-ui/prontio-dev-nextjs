import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockOnSelect = vi.fn();
let mockSearchResults: {
  id: string;
  nome: string;
  codigo_tuss: string | null;
}[] = [
  { id: "e-1", nome: "Hemograma Completo", codigo_tuss: "40304361" },
  { id: "e-2", nome: "Hemoglobina Glicada", codigo_tuss: null },
];
let mockError: { message: string } | null = null;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        ilike: () => ({
          order: () => ({
            limit: () =>
              Promise.resolve({
                data: mockError ? null : mockSearchResults,
                error: mockError,
              }),
          }),
        }),
      }),
    }),
  }),
}));

import { ExameSearch } from "./exame-search";

describe("ExameSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockOnSelect.mockClear();
    mockError = null;
    mockSearchResults = [
      { id: "e-1", nome: "Hemograma Completo", codigo_tuss: "40304361" },
      { id: "e-2", nome: "Hemoglobina Glicada", codigo_tuss: null },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza o input de busca com placeholder", () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    expect(
      screen.getByPlaceholderText("Buscar exame no catálogo...")
    ).toBeInTheDocument();
  });

  it("busca exames após digitar 2+ caracteres", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Hemograma Completo")).toBeInTheDocument();
      expect(screen.getByText("Hemoglobina Glicada")).toBeInTheDocument();
    });
  });

  it("exibe código TUSS quando disponível", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("TUSS: 40304361")).toBeInTheDocument();
    });
  });

  it("não exibe código TUSS quando é null", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Hemoglobina Glicada")).toBeInTheDocument();
    });

    // Only one TUSS entry should exist (for Hemograma Completo)
    const tussElements = screen.getAllByText(/TUSS:/);
    expect(tussElements).toHaveLength(1);
  });

  it("chama onSelect ao clicar no resultado", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Hemograma Completo")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Hemograma Completo"));

    expect(mockOnSelect).toHaveBeenCalledWith({
      id: "e-1",
      nome: "Hemograma Completo",
      codigo_tuss: "40304361",
    });
  });

  it("limpa o input após selecionar um exame", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Hemograma Completo")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Hemograma Completo"));

    expect(input).toHaveValue("");
  });

  it("não busca com menos de 2 caracteres", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "H");
    vi.advanceTimersByTime(350);

    expect(screen.queryByText("Hemograma Completo")).not.toBeInTheDocument();
  });

  it("fecha dropdown ao clicar fora", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Hemograma Completo")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Hemograma Completo")).not.toBeInTheDocument();
  });

  it("exibe mensagem quando nenhum exame é encontrado", async () => {
    mockSearchResults = [];
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "Xyz");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum exame encontrado.")
      ).toBeInTheDocument();
    });
  });

  it("exibe mensagem de erro quando a busca falha", async () => {
    mockError = { message: "Network error" };
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(
        screen.getByText("Erro ao buscar exames. Tente novamente.")
      ).toBeInTheDocument();
    });
  });

  it("usa array vazio quando Supabase retorna data null", async () => {
    mockSearchResults = null as unknown as typeof mockSearchResults;
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum exame encontrado.")
      ).toBeInTheDocument();
    });
  });

  it("reabre dropdown ao focar no input quando há resultados", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Hemograma Completo")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Hemograma Completo")).not.toBeInTheDocument();

    fireEvent.focus(input);
    expect(screen.getByText("Hemograma Completo")).toBeInTheDocument();
  });

  it("navega com teclado ArrowDown/ArrowUp e seleciona com Enter", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Hemograma Completo")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(
      screen.getByRole("option", { name: /Hemograma Completo/i })
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(
      screen.getByRole("option", { name: /Hemoglobina Glicada/i })
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(
      screen.getByRole("option", { name: /Hemograma Completo/i })
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "e-1", nome: "Hemograma Completo" })
    );
  });

  it("fecha dropdown ao pressionar Escape", async () => {
    render(<ExameSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText("Buscar exame no catálogo...");

    await userEvent.type(input, "He");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Hemograma Completo")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Hemograma Completo")).not.toBeInTheDocument();
  });
});
