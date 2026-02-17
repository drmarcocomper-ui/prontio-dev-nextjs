import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  salvarHorariosProfissional: vi.fn(),
}));

vi.mock("@/app/(dashboard)/agenda/utils", () => ({
  // Only the type HorarioProfissional is used from here
}));

import { HorariosProfissionalForm } from "./horarios-profissional-form";
import type { HorarioProfissional } from "@/app/(dashboard)/agenda/utils";

const emptyDefaults: HorarioProfissional[] = [];

const savedDefaults: HorarioProfissional[] = [
  { dia_semana: 1, ativo: true, hora_inicio: "09:00", hora_fim: "17:00", intervalo_inicio: "12:30", intervalo_fim: "13:30", duracao_consulta: 30 },
  { dia_semana: 2, ativo: true, hora_inicio: "09:00", hora_fim: "17:00", intervalo_inicio: "12:30", intervalo_fim: "13:30", duracao_consulta: 30 },
  { dia_semana: 3, ativo: false, hora_inicio: null, hora_fim: null, intervalo_inicio: null, intervalo_fim: null, duracao_consulta: 30 },
  { dia_semana: 4, ativo: true, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: "12:00", intervalo_fim: "13:00", duracao_consulta: 30 },
  { dia_semana: 5, ativo: true, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: "12:00", intervalo_fim: "13:00", duracao_consulta: 30 },
  { dia_semana: 6, ativo: false, hora_inicio: null, hora_fim: null, intervalo_inicio: null, intervalo_fim: null, duracao_consulta: 30 },
  { dia_semana: 0, ativo: false, hora_inicio: null, hora_fim: null, intervalo_inicio: null, intervalo_fim: null, duracao_consulta: 30 },
];

describe("HorariosProfissionalForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("renderiza o campo de duração da consulta", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText(/Duração da consulta/)).toBeInTheDocument();
  });

  it("duração padrão é 15 minutos quando sem defaults", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByLabelText(/Duração da consulta/)).toHaveValue(15);
  });

  it("renderiza os 7 dias da semana", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByText("Segunda")).toBeInTheDocument();
    expect(screen.getByText("Terça")).toBeInTheDocument();
    expect(screen.getByText("Quarta")).toBeInTheDocument();
    expect(screen.getByText("Quinta")).toBeInTheDocument();
    expect(screen.getByText("Sexta")).toBeInTheDocument();
    expect(screen.getByText("Sábado")).toBeInTheDocument();
    expect(screen.getByText("Domingo")).toBeInTheDocument();
  });

  it("renderiza toggle switches para cada dia", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(7);
  });

  it("dias padrão têm estado ativo correto (seg-sex ativo, sab ativo, dom inativo)", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    const switches = screen.getAllByRole("switch");
    // Ordem: seg, ter, qua, qui, sex, sab, dom
    expect(switches[0]).toHaveAttribute("aria-checked", "true"); // Segunda
    expect(switches[1]).toHaveAttribute("aria-checked", "true"); // Terça
    expect(switches[2]).toHaveAttribute("aria-checked", "true"); // Quarta
    expect(switches[3]).toHaveAttribute("aria-checked", "true"); // Quinta
    expect(switches[4]).toHaveAttribute("aria-checked", "true"); // Sexta
    expect(switches[5]).toHaveAttribute("aria-checked", "true"); // Sábado
    expect(switches[6]).toHaveAttribute("aria-checked", "false"); // Domingo
  });

  it("exibe Folga para dias inativos", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    // Domingo is inactive by default
    expect(screen.getByText("Folga")).toBeInTheDocument();
  });

  it("renderiza campos de expediente para dias ativos", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    // Multiple "Expediente" labels should be present for active days
    const expedienteLabels = screen.getAllByText("Expediente");
    expect(expedienteLabels.length).toBeGreaterThan(0);
  });

  it("renderiza campos de intervalo para dias ativos", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    // Multiple "Intervalo" labels should be present for active days
    const intervaloLabels = screen.getAllByText("Intervalo");
    expect(intervaloLabels.length).toBeGreaterThan(0);
  });

  it("renderiza o botão Salvar", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByRole("button", { name: /Salvar/ })).toBeInTheDocument();
  });

  it("usa valores salvos quando fornecidos", () => {
    render(<HorariosProfissionalForm defaults={savedDefaults} />);
    expect(screen.getByLabelText(/Duração da consulta/)).toHaveValue(30);
  });

  it("toggle alterna dia de ativo para inativo", async () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    const switches = screen.getAllByRole("switch");
    // Segunda is active by default
    expect(switches[0]).toHaveAttribute("aria-checked", "true");
    await userEvent.click(switches[0]);
    expect(switches[0]).toHaveAttribute("aria-checked", "false");
  });

  it("toggle alterna dia de inativo para ativo", async () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    const switches = screen.getAllByRole("switch");
    // Domingo is inactive by default
    expect(switches[6]).toHaveAttribute("aria-checked", "false");
    await userEvent.click(switches[6]);
    expect(switches[6]).toHaveAttribute("aria-checked", "true");
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao salvar horários." };
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    expect(screen.getByText("Erro ao salvar horários.")).toBeInTheDocument();
  });

  it("chama toast.success quando state.success é true", () => {
    formState.current = { success: true };
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Horários salvos com sucesso.");
  });

  it("desabilita botão quando isPending", () => {
    formPending.current = true;
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    const button = screen.getByRole("button", { name: /Salvar/ });
    expect(button).toBeDisabled();
  });

  it("desabilita toggles quando isPending", () => {
    formPending.current = true;
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    const switches = screen.getAllByRole("switch");
    switches.forEach((sw) => {
      expect(sw).toBeDisabled();
    });
  });

  it("campo duração tem min 5 e max 240", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    const input = screen.getByLabelText(/Duração da consulta/);
    expect(input).toHaveAttribute("min", "5");
    expect(input).toHaveAttribute("max", "240");
  });

  it("campo duração tem step de 5", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    const input = screen.getByLabelText(/Duração da consulta/);
    expect(input).toHaveAttribute("step", "5");
  });

  it("usa defaults salvos para estado ativo dos dias", () => {
    render(<HorariosProfissionalForm defaults={savedDefaults} />);
    const switches = screen.getAllByRole("switch");
    // savedDefaults: seg=true, ter=true, qua=false, qui=true, sex=true, sab=false, dom=false
    expect(switches[0]).toHaveAttribute("aria-checked", "true");  // Segunda
    expect(switches[1]).toHaveAttribute("aria-checked", "true");  // Terça
    expect(switches[2]).toHaveAttribute("aria-checked", "false"); // Quarta
    expect(switches[3]).toHaveAttribute("aria-checked", "true");  // Quinta
    expect(switches[4]).toHaveAttribute("aria-checked", "true");  // Sexta
    expect(switches[5]).toHaveAttribute("aria-checked", "false"); // Sábado
    expect(switches[6]).toHaveAttribute("aria-checked", "false"); // Domingo
  });

  it("renderiza hidden fields para dias ativos", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    // Check hidden fields for active days (seg is active)
    const ativoHidden = document.querySelector('input[name="ativo_seg"]') as HTMLInputElement;
    expect(ativoHidden).toBeInTheDocument();
    expect(ativoHidden.value).toBe("true");
  });

  it("renderiza hidden field ativo=false para dias inativos", () => {
    render(<HorariosProfissionalForm defaults={emptyDefaults} />);
    // Domingo is inactive by default
    const ativoHidden = document.querySelector('input[name="ativo_dom"]') as HTMLInputElement;
    expect(ativoHidden).toBeInTheDocument();
    expect(ativoHidden.value).toBe("false");
  });
});
