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

vi.mock("./actions", () => ({ salvarProfissional: vi.fn() }));

vi.mock("@/lib/theme", () => ({
  THEME_OPTIONS: [
    { key: "sky", label: "Céu", swatch: "bg-sky-500" },
    { key: "blue", label: "Azul", swatch: "bg-blue-500" },
    { key: "violet", label: "Violeta", swatch: "bg-violet-500" },
    { key: "emerald", label: "Esmeralda", swatch: "bg-emerald-500" },
    { key: "rose", label: "Rosa", swatch: "bg-rose-500" },
    { key: "amber", label: "Âmbar", swatch: "bg-amber-500" },
  ],
}));

import { AparenciaForm } from "./aparencia-form";

const emptyDefaults: Record<string, string> = {};

describe("AparenciaForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("renderiza a legenda 'Cor primária'", () => {
    render(<AparenciaForm defaults={emptyDefaults} />);
    expect(screen.getByText("Cor primária")).toBeInTheDocument();
  });

  it("renderiza 6 opções de tema", () => {
    render(<AparenciaForm defaults={emptyDefaults} />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(6);
  });

  it("marca tema padrão sky quando defaults não tem cor_primaria", () => {
    render(<AparenciaForm defaults={emptyDefaults} />);
    const skyRadio = screen.getByRole("radio", { checked: true });
    expect(skyRadio).toHaveAttribute("value", "sky");
  });

  it("marca tema correto de acordo com defaults.cor_primaria", () => {
    render(<AparenciaForm defaults={{ cor_primaria: "violet" }} />);
    const checkedRadio = screen.getByRole("radio", { checked: true });
    expect(checkedRadio).toHaveAttribute("value", "violet");
  });

  it("renderiza botão Salvar", () => {
    render(<AparenciaForm defaults={emptyDefaults} />);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("desabilita botão e inputs quando pendente", () => {
    formPending.current = true;
    render(<AparenciaForm defaults={emptyDefaults} />);
    const button = screen.getByRole("button", { name: /Salvar/ });
    expect(button).toBeDisabled();
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it("exibe mensagem de erro quando state tem error", () => {
    formState.current = { error: "Erro ao salvar configurações. Tente novamente." };
    render(<AparenciaForm defaults={emptyDefaults} />);
    expect(screen.getByText("Erro ao salvar configurações. Tente novamente.")).toBeInTheDocument();
  });
});
