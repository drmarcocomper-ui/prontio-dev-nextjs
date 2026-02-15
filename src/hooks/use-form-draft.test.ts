import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormDraft } from "./use-form-draft";

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

function createFormElement(fields: Record<string, string> = {}) {
  const form = document.createElement("form");
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  return form;
}

describe("useFormDraft", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("hasDraft retorna false quando não há rascunho", () => {
    const form = createFormElement();
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));
    expect(result.current.hasDraft()).toBe(false);
  });

  it("saveDraft salva dados do formulário no localStorage", () => {
    const form = createFormElement({ nome: "Maria", email: "maria@test.com" });
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.saveDraft(); });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "prontio_draft_test-form",
      expect.stringContaining("Maria")
    );
  });

  it("saveDraft ignora campos vazios", () => {
    const form = createFormElement({ nome: "Maria", vazio: "" });
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.saveDraft(); });

    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved.nome).toBe("Maria");
    expect(saved.vazio).toBeUndefined();
  });

  it("saveDraft não salva quando todos os campos estão vazios", () => {
    const form = createFormElement({ nome: "", email: "" });
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.saveDraft(); });

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it("saveDraft não faz nada quando formRef é null", () => {
    const ref = { current: null };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.saveDraft(); });

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it("hasDraft retorna true após salvar", () => {
    const form = createFormElement({ nome: "Maria" });
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.saveDraft(); });

    expect(result.current.hasDraft()).toBe(true);
  });

  it("clearDraft remove o rascunho do localStorage", () => {
    store["prontio_draft_test-form"] = JSON.stringify({ nome: "Maria" });
    const form = createFormElement();
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.clearDraft(); });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("prontio_draft_test-form");
  });

  it("restoreDraft restaura dados no formulário", () => {
    store["prontio_draft_test-form"] = JSON.stringify({ nome: "Maria" });
    const form = createFormElement({ nome: "" });
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    let restored: boolean | undefined;
    act(() => { restored = result.current.restoreDraft(); });

    expect(restored).toBe(true);
    const input = form.elements.namedItem("nome") as HTMLInputElement;
    expect(input.value).toBe("Maria");
  });

  it("restoreDraft não sobrescreve campos com valor existente", () => {
    store["prontio_draft_test-form"] = JSON.stringify({ nome: "Maria" });
    const form = createFormElement({ nome: "João" });
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.restoreDraft(); });

    const input = form.elements.namedItem("nome") as HTMLInputElement;
    expect(input.value).toBe("João");
  });

  it("restoreDraft não sobrescreve campos hidden", () => {
    store["prontio_draft_test-form"] = JSON.stringify({ id: "new-id" });
    const form = document.createElement("form");
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "id";
    hidden.value = "original-id";
    form.appendChild(hidden);
    document.body.appendChild(form);
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.restoreDraft(); });

    expect(hidden.value).toBe("original-id");
  });

  it("restoreDraft retorna false quando não há rascunho", () => {
    const form = createFormElement({ nome: "" });
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    let restored: boolean | undefined;
    act(() => { restored = result.current.restoreDraft(); });

    expect(restored).toBe(false);
  });

  it("restoreDraft retorna false quando formRef é null", () => {
    store["prontio_draft_test-form"] = JSON.stringify({ nome: "Maria" });
    const ref = { current: null };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    let restored: boolean | undefined;
    act(() => { restored = result.current.restoreDraft(); });

    expect(restored).toBe(false);
  });

  it("restoreDraft só restaura uma vez", () => {
    store["prontio_draft_test-form"] = JSON.stringify({ nome: "Maria" });
    const form = createFormElement({ nome: "" });
    const ref = { current: form };
    const { result } = renderHook(() => useFormDraft("test-form", ref));

    act(() => { result.current.restoreDraft(); });

    // Limpa o campo para testar segunda chamada
    (form.elements.namedItem("nome") as HTMLInputElement).value = "";
    act(() => { result.current.restoreDraft(); });

    expect((form.elements.namedItem("nome") as HTMLInputElement).value).toBe("");
  });

  it("auto-salva no intervalo configurado", () => {
    const form = createFormElement({ nome: "Maria" });
    const ref = { current: form };
    renderHook(() => useFormDraft("test-form", ref, { interval: 1000 }));

    act(() => { vi.advanceTimersByTime(1000); });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("limpa rascunho ao submeter o formulário", () => {
    const form = createFormElement({ nome: "Maria" });
    const ref = { current: form };
    renderHook(() => useFormDraft("test-form", ref));

    form.dispatchEvent(new Event("submit"));
    act(() => { vi.advanceTimersByTime(200); });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("prontio_draft_test-form");
  });

  it("usa formId diferente para chaves diferentes", () => {
    const form1 = createFormElement({ nome: "Maria" });
    const form2 = createFormElement({ nome: "João" });
    const ref1 = { current: form1 };
    const ref2 = { current: form2 };
    const { result: r1 } = renderHook(() => useFormDraft("form-a", ref1));
    const { result: r2 } = renderHook(() => useFormDraft("form-b", ref2));

    act(() => { r1.current.saveDraft(); });
    act(() => { r2.current.saveDraft(); });

    expect(store["prontio_draft_form-a"]).toContain("Maria");
    expect(store["prontio_draft_form-b"]).toContain("João");
  });
});
