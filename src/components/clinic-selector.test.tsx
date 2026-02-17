import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockFetch = vi.fn().mockResolvedValue({ ok: true });
global.fetch = mockFetch;

import { ClinicSelector } from "./clinic-selector";

const clinicas = [
  { id: "c-1", nome: "Clínica Alpha", papel: "superadmin" as const },
  { id: "c-2", nome: "Clínica Beta", papel: "profissional_saude" as const },
];

describe("ClinicSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza nome da clínica atual sem botão quando há apenas uma", () => {
    render(<ClinicSelector clinicas={[clinicas[0]]} clinicaAtualId="c-1" />);
    expect(screen.getByText("Clínica Alpha")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renderiza botão combobox com nome da clínica quando há múltiplas", () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    const button = screen.getByRole("combobox");
    expect(button).toHaveTextContent("Clínica Alpha");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-haspopup", "listbox");
  });

  it("abre listbox ao clicar no botão", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");
  });

  it("chama fetch e router.refresh ao selecionar outra clínica", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByText("Clínica Beta"));
    expect(mockFetch).toHaveBeenCalledWith("/api/clinica", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ clinicaId: "c-2" }),
    }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("não chama fetch ao selecionar a clínica atual", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    await userEvent.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option");
    await userEvent.click(options[0]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fecha dropdown ao clicar fora", async () => {
    render(
      <div>
        <span data-testid="outside">fora</span>
        <ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />
      </div>
    );
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("navega com setas do teclado", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    const button = screen.getByRole("combobox");
    // Open with ArrowDown
    fireEvent.keyDown(button, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    // activeIndex starts at current clinic (c-1 = index 0), ArrowDown moves to c-2
    fireEvent.keyDown(button, { key: "ArrowDown" });
    expect(button).toHaveAttribute("aria-activedescendant", "clinic-option-c-2");
  });

  it("seleciona com Enter", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    const button = screen.getByRole("combobox");
    // Open
    fireEvent.keyDown(button, { key: "ArrowDown" });
    // Move to Clínica Beta (index 1)
    fireEvent.keyDown(button, { key: "ArrowDown" });
    // Select
    fireEvent.keyDown(button, { key: "Enter" });
    expect(mockFetch).toHaveBeenCalledWith("/api/clinica", expect.objectContaining({
      body: JSON.stringify({ clinicaId: "c-2" }),
    }));
  });

  it("fecha com Escape", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    const button = screen.getByRole("combobox");
    await userEvent.click(button);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(button, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("exibe fallback 'Clínica' quando nome não encontrado", () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-inexistente" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Clínica Alpha");
  });
});
