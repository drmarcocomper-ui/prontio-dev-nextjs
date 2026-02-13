"use client";

import { useEffect, useCallback, useRef } from "react";

const DRAFT_PREFIX = "prontio_draft_";

/**
 * Hook para salvar rascunho de formulário automaticamente no localStorage.
 * Restaura dados ao montar se houver rascunho salvo.
 *
 * @param formId — Identificador único do formulário (ex: "paciente-novo", "prontuario-edit-123")
 * @param formRef — Ref para o <form> element
 * @param options — { interval: ms entre salvamentos automáticos (default 3000) }
 */
export function useFormDraft(
  formId: string,
  formRef: React.RefObject<HTMLFormElement | null>,
  options?: { interval?: number }
) {
  const interval = options?.interval ?? 3000;
  const key = DRAFT_PREFIX + formId;
  const restoredRef = useRef(false);

  // Save current form data to localStorage
  const saveDraft = useCallback(() => {
    const form = formRef.current;
    if (!form) return;

    const data: Record<string, string> = {};
    const formData = new FormData(form);
    for (const [name, value] of formData.entries()) {
      if (typeof value === "string" && value.trim()) {
        data[name] = value;
      }
    }

    if (Object.keys(data).length > 0) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // localStorage full or unavailable
      }
    }
  }, [formRef, key]);

  // Clear the draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  // Check if a draft exists
  const hasDraft = useCallback((): boolean => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }, [key]);

  // Restore draft data into the form
  const restoreDraft = useCallback(() => {
    const form = formRef.current;
    if (!form || restoredRef.current) return false;

    try {
      const saved = localStorage.getItem(key);
      if (!saved) return false;

      const data = JSON.parse(saved) as Record<string, string>;
      let restored = false;

      for (const [name, value] of Object.entries(data)) {
        const el = form.elements.namedItem(name);
        if (el && el instanceof HTMLElement && "value" in el) {
          const input = el as unknown as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          // Don't overwrite hidden fields or fields that already have values from defaults
          if (input.type === "hidden") continue;
          if (input.value && input.value !== "") continue;
          input.value = value;
          restored = true;
        }
      }

      restoredRef.current = true;
      return restored;
    } catch {
      return false;
    }
  }, [formRef, key]);

  // Auto-save on interval
  useEffect(() => {
    const timer = setInterval(saveDraft, interval);
    return () => clearInterval(timer);
  }, [saveDraft, interval]);

  // Clear draft on successful form submission
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    function handleSubmit() {
      // Clear on next tick (after form submission starts)
      setTimeout(clearDraft, 100);
    }

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [formRef, clearDraft]);

  return { saveDraft, clearDraft, restoreDraft, hasDraft };
}
