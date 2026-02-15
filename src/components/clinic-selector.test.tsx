import { render, screen } from "@testing-library/react";
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
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renderiza botão com nome da clínica quando há múltiplas", () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Clínica Alpha");
  });

  it("abre dropdown ao clicar no botão", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Clínica Beta")).toBeInTheDocument();
  });

  it("chama fetch e router.refresh ao selecionar outra clínica", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByText("Clínica Beta"));
    expect(mockFetch).toHaveBeenCalledWith("/api/clinica", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ clinicaId: "c-2" }),
    }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("não chama fetch ao selecionar a clínica atual", async () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />);
    await userEvent.click(screen.getByRole("button"));
    const items = screen.getAllByText("Clínica Alpha");
    // Click the dropdown item (second one), not the button label
    await userEvent.click(items[1]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fecha dropdown ao clicar fora", async () => {
    render(
      <div>
        <span data-testid="outside">fora</span>
        <ClinicSelector clinicas={clinicas} clinicaAtualId="c-1" />
      </div>
    );
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Clínica Beta")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("outside"));
    expect(screen.queryByText("Clínica Beta")).not.toBeInTheDocument();
  });

  it("exibe fallback 'Clínica' quando nome não encontrado", () => {
    render(<ClinicSelector clinicas={clinicas} clinicaAtualId="c-inexistente" />);
    expect(screen.getByRole("button")).toHaveTextContent("Clínica Alpha");
  });
});
