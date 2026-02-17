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
  salvarHorarios: vi.fn(),
}));

vi.mock("./constants", async () => {
  const actual = await vi.importActual("./constants");
  return { ...actual };
});

import { HorariosForm } from "./horarios-form";

const emptyDefaults: Record<string, string> = {};

describe("HorariosForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("renderiza o campo de duração da consulta", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText(/Duração padrão da consulta/)).toBeInTheDocument();
  });

  it("duração padrão é 15 minutos", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText(/Duração padrão da consulta/)).toHaveValue(15);
  });

  it("renderiza os 6 dias da semana", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    expect(screen.getByText("Segunda-feira")).toBeInTheDocument();
    expect(screen.getByText("Terça-feira")).toBeInTheDocument();
    expect(screen.getByText("Quarta-feira")).toBeInTheDocument();
    expect(screen.getByText("Quinta-feira")).toBeInTheDocument();
    expect(screen.getByText("Sexta-feira")).toBeInTheDocument();
    expect(screen.getByText("Sábado")).toBeInTheDocument();
  });

  it("renderiza campos de horário início e fim para cada dia", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    const dias = ["seg", "ter", "qua", "qui", "sex", "sab"];
    dias.forEach((dia) => {
      const inicio = document.querySelector(`input[name="config_horario_${dia}_inicio"]`) as HTMLInputElement;
      const fim = document.querySelector(`input[name="config_horario_${dia}_fim"]`) as HTMLInputElement;
      expect(inicio).toBeInTheDocument();
      expect(fim).toBeInTheDocument();
    });
  });

  it("horários padrão são 08:00 e 18:00", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    const inicio = document.querySelector('input[name="config_horario_seg_inicio"]') as HTMLInputElement;
    const fim = document.querySelector('input[name="config_horario_seg_fim"]') as HTMLInputElement;
    expect(inicio.value).toBe("08:00");
    expect(fim.value).toBe("18:00");
  });

  it("renderiza a seção de intervalo", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    expect(screen.getByText("Intervalo")).toBeInTheDocument();
    const intervaloInicio = document.querySelector('input[name="config_intervalo_inicio"]') as HTMLInputElement;
    const intervaloFim = document.querySelector('input[name="config_intervalo_fim"]') as HTMLInputElement;
    expect(intervaloInicio.value).toBe("12:00");
    expect(intervaloFim.value).toBe("13:00");
  });

  it("renderiza o botão Salvar", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("usa valores salvos quando fornecidos", () => {
    const defaults: Record<string, string> = {
      duracao_consulta: "45",
      horario_seg_inicio: "09:00",
      horario_seg_fim: "17:00",
      intervalo_inicio: "12:30",
      intervalo_fim: "13:30",
    };
    render(<HorariosForm defaults={defaults} />);
    expect(screen.getByLabelText(/Duração padrão da consulta/)).toHaveValue(45);
    const inicio = document.querySelector('input[name="config_horario_seg_inicio"]') as HTMLInputElement;
    expect(inicio.value).toBe("09:00");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar configurações. Tente novamente." };
    render(<HorariosForm defaults={{}} />);
    expect(screen.getByText("Erro ao salvar configurações. Tente novamente.")).toBeInTheDocument();
  });

  it("chama toast.success quando state.success é true", () => {
    formState.current = { success: true };
    render(<HorariosForm defaults={{}} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Configurações salvas com sucesso.");
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<HorariosForm defaults={{}} />);
    const button = screen.getByRole("button", { name: /Salvar/ });
    expect(button).toBeDisabled();
  });
});
