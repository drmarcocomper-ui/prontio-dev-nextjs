import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useActionState: () => [formState.current, vi.fn(), formPending.current] };
});

vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

vi.mock("./actions", () => ({
  salvarValores: vi.fn(),
}));

import { ValoresForm } from "./valores-form";

const emptyDefaults: Record<string, string> = {};

describe("ValoresForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("renderiza o título de valores", () => {
    render(<ValoresForm defaults={emptyDefaults} />);
    expect(screen.getByText("Valor da consulta por convênio")).toBeInTheDocument();
  });

  it("renderiza todos os convênios", () => {
    render(<ValoresForm defaults={emptyDefaults} />);
    expect(screen.getByText("Particular")).toBeInTheDocument();
    expect(screen.getByText("Bradesco")).toBeInTheDocument();
    expect(screen.getByText("Unimed")).toBeInTheDocument();
    expect(screen.getByText("Cortesia")).toBeInTheDocument();
  });

  it("cortesia tem input desabilitado com valor fixo 0,00", () => {
    render(<ValoresForm defaults={emptyDefaults} />);
    // All convênio inputs except cortesia should have name config_valor_convenio_*
    // Cortesia should NOT have a named input
    const cortesiaInput = document.querySelector('input[name="config_valor_convenio_cortesia"]');
    expect(cortesiaInput).toBeNull();

    // Find disabled inputs - cortesia is disabled
    const allInputs = document.querySelectorAll("input[type='text']");
    const disabledInputs = Array.from(allInputs).filter((i) => (i as HTMLInputElement).disabled);
    expect(disabledInputs.length).toBeGreaterThan(0);
    expect((disabledInputs[0] as HTMLInputElement).value).toBe("0,00");
  });

  it("usa valores salvos quando fornecidos", () => {
    const defaults: Record<string, string> = {
      valor_convenio_bradesco: "350.00",
      valor_convenio_unimed: "400.00",
    };
    render(<ValoresForm defaults={defaults} />);
    const bradescoInput = document.querySelector('input[name="config_valor_convenio_bradesco"]') as HTMLInputElement;
    expect(bradescoInput.value).toBe("350,00");
    const unimedInput = document.querySelector('input[name="config_valor_convenio_unimed"]') as HTMLInputElement;
    expect(unimedInput.value).toBe("400,00");
  });

  it("renderiza o botão Salvar", () => {
    render(<ValoresForm defaults={emptyDefaults} />);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar valores. Tente novamente." };
    render(<ValoresForm defaults={{}} />);
    expect(screen.getByText("Erro ao salvar valores. Tente novamente.")).toBeInTheDocument();
  });

  it("chama toast.success quando state.success é true", () => {
    formState.current = { success: true };
    render(<ValoresForm defaults={{}} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Valores salvos com sucesso.");
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<ValoresForm defaults={{}} />);
    const button = screen.getByRole("button", { name: /Salvar/ });
    expect(button).toBeDisabled();
  });

  it("inputs de convênio têm name no formato config_valor_convenio_*", () => {
    render(<ValoresForm defaults={emptyDefaults} />);
    const particularInput = document.querySelector('input[name="config_valor_convenio_particular"]') as HTMLInputElement;
    expect(particularInput).toBeInTheDocument();
  });
});
