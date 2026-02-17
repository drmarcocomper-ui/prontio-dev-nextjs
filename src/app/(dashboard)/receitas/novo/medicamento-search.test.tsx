import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockOnSelect = vi.fn();
let mockSearchResults: {
  id: string;
  nome: string;
  posologia: string | null;
  quantidade: string | null;
  via_administracao: string | null;
}[] = [
  {
    id: "m-1",
    nome: "Amoxicilina 500mg",
    posologia: "8/8h",
    quantidade: "21 comprimidos",
    via_administracao: "Oral",
  },
  {
    id: "m-2",
    nome: "Amoxicilina 875mg",
    posologia: "12/12h",
    quantidade: null,
    via_administracao: "Oral",
  },
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

import { MedicamentoSearch } from "./medicamento-search";

describe("MedicamentoSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockOnSelect.mockClear();
    mockError = null;
    mockSearchResults = [
      {
        id: "m-1",
        nome: "Amoxicilina 500mg",
        posologia: "8/8h",
        quantidade: "21 comprimidos",
        via_administracao: "Oral",
      },
      {
        id: "m-2",
        nome: "Amoxicilina 875mg",
        posologia: "12/12h",
        quantidade: null,
        via_administracao: "Oral",
      },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza o input de busca com placeholder", () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    expect(
      screen.getByPlaceholderText("Buscar medicamento no catálogo...")
    ).toBeInTheDocument();
  });

  it("busca medicamentos após digitar 2+ caracteres", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
      expect(screen.getByText("Amoxicilina 875mg")).toBeInTheDocument();
    });
  });

  it("exibe detalhes do medicamento nos resultados", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(
        screen.getByText("8/8h · 21 comprimidos · Oral")
      ).toBeInTheDocument();
      expect(screen.getByText("12/12h · Oral")).toBeInTheDocument();
    });
  });

  it("chama onSelect ao clicar no resultado", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Amoxicilina 500mg"));

    expect(mockOnSelect).toHaveBeenCalledWith({
      id: "m-1",
      nome: "Amoxicilina 500mg",
      posologia: "8/8h",
      quantidade: "21 comprimidos",
      via_administracao: "Oral",
    });
  });

  it("limpa o input após selecionar um medicamento", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Amoxicilina 500mg"));

    expect(input).toHaveValue("");
  });

  it("não busca com menos de 2 caracteres", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "A");
    vi.advanceTimersByTime(350);

    expect(screen.queryByText("Amoxicilina 500mg")).not.toBeInTheDocument();
  });

  it("fecha dropdown ao clicar fora", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Amoxicilina 500mg")).not.toBeInTheDocument();
  });

  it("exibe mensagem quando nenhum medicamento é encontrado", async () => {
    mockSearchResults = [];
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Xyz");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum medicamento encontrado.")
      ).toBeInTheDocument();
    });
  });

  it("exibe mensagem de erro quando a busca falha", async () => {
    mockError = { message: "Network error" };
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(
        screen.getByText("Erro ao buscar medicamentos. Tente novamente.")
      ).toBeInTheDocument();
    });
  });

  it("usa array vazio quando Supabase retorna data null", async () => {
    mockSearchResults = null as unknown as typeof mockSearchResults;
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum medicamento encontrado.")
      ).toBeInTheDocument();
    });
  });

  it("reabre dropdown ao focar no input quando há resultados", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Amoxicilina 500mg")).not.toBeInTheDocument();

    fireEvent.focus(input);
    expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
  });

  it("navega com teclado ArrowDown/ArrowUp e seleciona com Enter", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /Amoxicilina 500mg/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /Amoxicilina 875mg/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: /Amoxicilina 500mg/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m-1", nome: "Amoxicilina 500mg" })
    );
  });

  it("fecha dropdown ao pressionar Escape", async () => {
    render(<MedicamentoSearch onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(
      "Buscar medicamento no catálogo..."
    );

    await userEvent.type(input, "Am");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Amoxicilina 500mg")).not.toBeInTheDocument();
  });
});
