import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./actions", () => ({
  salvarConfiguracoes: vi.fn(),
}));

import { HorariosForm } from "./horarios-form";

const emptyDefaults: Record<string, string> = {};

describe("HorariosForm", () => {
  it("renderiza o campo de duração da consulta", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText(/Duração padrão da consulta/)).toBeInTheDocument();
  });

  it("duração padrão é 30 minutos", () => {
    render(<HorariosForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText(/Duração padrão da consulta/)).toHaveValue(30);
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
});
