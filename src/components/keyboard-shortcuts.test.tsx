import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { KeyboardShortcuts } from "./keyboard-shortcuts";

function pressKey(key: string, options: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

describe("KeyboardShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.getElementById("shortcuts-help")?.remove();
  });

  it("renderiza sem elementos visíveis", () => {
    const { container } = render(<KeyboardShortcuts />);
    expect(container.innerHTML).toBe("");
  });

  it("navega para / com g + h", () => {
    render(<KeyboardShortcuts />);
    pressKey("g");
    pressKey("h");
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("navega para /pacientes com g + p", () => {
    render(<KeyboardShortcuts />);
    pressKey("g");
    pressKey("p");
    expect(mockPush).toHaveBeenCalledWith("/pacientes");
  });

  it("navega para /agenda com g + a", () => {
    render(<KeyboardShortcuts />);
    pressKey("g");
    pressKey("a");
    expect(mockPush).toHaveBeenCalledWith("/agenda");
  });

  it("navega para /financeiro com g + f", () => {
    render(<KeyboardShortcuts />);
    pressKey("g");
    pressKey("f");
    expect(mockPush).toHaveBeenCalledWith("/financeiro");
  });

  it("navega para /configuracoes com g + c", () => {
    render(<KeyboardShortcuts />);
    pressKey("g");
    pressKey("c");
    expect(mockPush).toHaveBeenCalledWith("/configuracoes");
  });

  it("não navega se segunda tecla demorar mais de 1s", () => {
    render(<KeyboardShortcuts />);
    pressKey("g");
    vi.advanceTimersByTime(1100);
    pressKey("h");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("exibe overlay de ajuda ao pressionar ?", () => {
    render(<KeyboardShortcuts />);
    pressKey("?");
    const help = document.getElementById("shortcuts-help");
    expect(help).not.toBeNull();
    expect(help!.textContent).toContain("Atalhos de teclado");
  });

  it("fecha overlay de ajuda ao pressionar Escape", () => {
    render(<KeyboardShortcuts />);
    pressKey("?");
    expect(document.getElementById("shortcuts-help")).not.toBeNull();
    pressKey("Escape");
    expect(document.getElementById("shortcuts-help")).toBeNull();
  });

  it("fecha overlay de ajuda ao pressionar ? novamente", () => {
    render(<KeyboardShortcuts />);
    pressKey("?");
    expect(document.getElementById("shortcuts-help")).not.toBeNull();
    pressKey("?");
    expect(document.getElementById("shortcuts-help")).toBeNull();
  });

  it("ignora atalhos quando foco está em input", () => {
    render(<KeyboardShortcuts />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "g", bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "h", bubbles: true }));
    expect(mockPush).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("foca no input de busca com Ctrl+K", () => {
    render(<KeyboardShortcuts />);
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    document.body.appendChild(searchInput);
    const focusSpy = vi.spyOn(searchInput, "focus");
    pressKey("k", { ctrlKey: true });
    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(searchInput);
  });
});
