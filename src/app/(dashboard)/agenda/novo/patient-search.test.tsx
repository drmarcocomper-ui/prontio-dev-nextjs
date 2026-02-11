import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSelect = vi.fn();
let mockSearchResults: { id: string; nome: string; cpf: string | null }[] = [
  { id: "p-1", nome: "Maria Silva", cpf: "12345678901" },
  { id: "p-2", nome: "Maria Oliveira", cpf: null },
];

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          ilike: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: mockSearchResults,
                }),
            }),
          }),
        };
      },
    }),
  }),
}));

import { PatientSearch } from "./patient-search";

describe("PatientSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSelect.mockClear();
    mockSearchResults = [
      { id: "p-1", nome: "Maria Silva", cpf: "12345678901" },
      { id: "p-2", nome: "Maria Oliveira", cpf: null },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza o input de busca com placeholder", () => {
    render(<PatientSearch />);
    expect(screen.getByPlaceholderText("Buscar paciente por nome...")).toBeInTheDocument();
  });

  it("renderiza com valor padrão quando fornecido", () => {
    render(<PatientSearch defaultPatientId="p-1" defaultPatientName="Maria Silva" />);
    expect(screen.getByDisplayValue("Maria Silva")).toBeInTheDocument();
  });

  it("inclui campo hidden para paciente_id", () => {
    render(<PatientSearch defaultPatientId="p-1" defaultPatientName="Maria Silva" />);
    const hidden = document.querySelector('input[name="paciente_id"]') as HTMLInputElement;
    expect(hidden).toBeInTheDocument();
    expect(hidden.value).toBe("p-1");
  });

  it("busca pacientes após digitar 2+ caracteres", async () => {
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "Ma");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
      expect(screen.getByText("Maria Oliveira")).toBeInTheDocument();
    });
  });

  it("exibe iniciais e CPF formatado nos resultados", async () => {
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "Ma");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("MS")).toBeInTheDocument();
      expect(screen.getByText("MO")).toBeInTheDocument();
      expect(screen.getByText("CPF: 123.456.789-01")).toBeInTheDocument();
    });
  });

  it("seleciona paciente ao clicar no resultado", async () => {
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "Ma");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Maria Silva"));

    expect(input).toHaveValue("Maria Silva");
    const hidden = document.querySelector('input[name="paciente_id"]') as HTMLInputElement;
    expect(hidden.value).toBe("p-1");
  });

  it("não busca com menos de 2 caracteres", async () => {
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "M");
    vi.advanceTimersByTime(350);

    expect(screen.queryByText("Maria Silva")).not.toBeInTheDocument();
  });

  it("fecha dropdown ao clicar fora", async () => {
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "Ma");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Maria Silva")).not.toBeInTheDocument();
  });

  it("exibe mensagem quando nenhum paciente é encontrado", async () => {
    mockSearchResults = [];
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "Xyz");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Nenhum paciente encontrado.")).toBeInTheDocument();
    });
  });

  it("limpa selectedId ao digitar após seleção", async () => {
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "Ma");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Maria Silva"));
    const hidden = document.querySelector('input[name="paciente_id"]') as HTMLInputElement;
    expect(hidden.value).toBe("p-1");

    await userEvent.clear(input);
    await userEvent.type(input, "Jo");

    expect(hidden.value).toBe("");
  });

  it("usa array vazio quando Supabase retorna data null", async () => {
    mockSearchResults = null as unknown as typeof mockSearchResults;
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "Ma");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Nenhum paciente encontrado.")).toBeInTheDocument();
    });
  });

  it("reabre dropdown ao focar no input quando há resultados", async () => {
    render(<PatientSearch />);
    const input = screen.getByPlaceholderText("Buscar paciente por nome...");

    await userEvent.type(input, "Ma");
    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Maria Silva")).not.toBeInTheDocument();

    fireEvent.focus(input);
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });
});
