import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

import { ViewToggle } from "./view-toggle";

describe("ViewToggle", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renderiza os botões Dia e Semana", () => {
    render(<ViewToggle currentView="dia" />);
    expect(screen.getByText("Dia")).toBeInTheDocument();
    expect(screen.getByText("Semana")).toBeInTheDocument();
  });

  it("renderiza o grupo com aria-label correto", () => {
    render(<ViewToggle currentView="dia" />);
    expect(screen.getByRole("group", { name: "Tipo de visualização" })).toBeInTheDocument();
  });

  it("aplica estilo ativo ao botão Dia quando currentView é dia", () => {
    render(<ViewToggle currentView="dia" />);
    const diaButton = screen.getByText("Dia").closest("button")!;
    expect(diaButton.className).toContain("bg-primary-50");
    expect(diaButton.className).toContain("text-primary-600");
  });

  it("aplica estilo ativo ao botão Semana quando currentView é semana", () => {
    render(<ViewToggle currentView="semana" />);
    const semanaButton = screen.getByText("Semana").closest("button")!;
    expect(semanaButton.className).toContain("bg-primary-50");
    expect(semanaButton.className).toContain("text-primary-600");
  });

  it("aplica estilo inativo ao botão Dia quando currentView é semana", () => {
    render(<ViewToggle currentView="semana" />);
    const diaButton = screen.getByText("Dia").closest("button")!;
    expect(diaButton.className).toContain("text-gray-500");
    expect(diaButton.className).not.toContain("bg-primary-50");
  });

  it("navega para visualização semanal ao clicar em Semana", async () => {
    const user = userEvent.setup();
    render(<ViewToggle currentView="dia" />);
    await user.click(screen.getByText("Semana"));
    expect(mockPush).toHaveBeenCalledWith("/agenda?view=semana");
  });

  it("navega para visualização diária ao clicar em Dia", async () => {
    const user = userEvent.setup();
    render(<ViewToggle currentView="semana" />);
    await user.click(screen.getByText("Dia"));
    expect(mockPush).toHaveBeenCalledWith("/agenda?");
  });

  it("remove parâmetro view ao selecionar dia", async () => {
    const user = userEvent.setup();
    render(<ViewToggle currentView="semana" />);
    await user.click(screen.getByText("Dia"));
    // "view" parameter is deleted when switching to "dia"
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).not.toContain("view=");
  });
});
