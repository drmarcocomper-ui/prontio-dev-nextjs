"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS = [
  { label: "Buscar", keys: ["Ctrl + K"] },
  { section: "Navegação (g + tecla)" },
  { label: "Painel", keys: ["g", "h"] },
  { label: "Pacientes", keys: ["g", "p"] },
  { label: "Agenda", keys: ["g", "a"] },
  { label: "Financeiro", keys: ["g", "f"] },
  { label: "Configurações", keys: ["g", "c"] },
  { divider: true },
  { label: "Esta ajuda", keys: ["?"] },
] as const;

export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => {
      if (!prev) {
        previousFocusRef.current = document.activeElement as HTMLElement;
      }
      return !prev;
    });
  }, []);

  // Restore focus when closing
  useEffect(() => {
    if (!showHelp && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
    if (showHelp) {
      dialogRef.current?.focus();
    }
  }, [showHelp]);

  useEffect(() => {
    let nextKeyTimeout: ReturnType<typeof setTimeout> | null = null;
    let nextKeyHandler: ((key: string) => void) | null = null;

    function waitForNextKey(handler: (key: string) => void) {
      nextKeyHandler = handler;
      nextKeyTimeout = setTimeout(() => {
        nextKeyHandler = null;
      }, 1000);
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + K → Focus search input (if present)
      if (mod && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[aria-label*="Buscar"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Navigation shortcuts (no modifier needed)
      if (!mod && !e.altKey && !e.shiftKey) {
        switch (e.key) {
          case "g":
            waitForNextKey((next) => {
              switch (next) {
                case "h": router.push("/"); break;
                case "p": router.push("/pacientes"); break;
                case "a": router.push("/agenda"); break;
                case "f": router.push("/financeiro"); break;
                case "c": router.push("/configuracoes"); break;
              }
            });
            break;
          case "?":
            toggleHelp();
            break;
        }
      }
    }

    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }
      if (nextKeyHandler) {
        e.preventDefault();
        const handler = nextKeyHandler;
        nextKeyHandler = null;
        if (nextKeyTimeout) clearTimeout(nextKeyTimeout);
        handler(e.key);
        return;
      }
      handleKeyDown(e);
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      if (nextKeyTimeout) clearTimeout(nextKeyTimeout);
    };
  }, [router, toggleHelp]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setShowHelp(false); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Atalhos de teclado"
        tabIndex={-1}
        className="animate-scale-in mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl outline-none"
      >
        <h2 className="text-lg font-bold text-gray-900">Atalhos de teclado</h2>
        <div className="mt-4 space-y-3">
          {SHORTCUTS.map((item, i) => {
            if ("divider" in item) return <hr key={i} className="border-gray-200" />;
            if ("section" in item) {
              return <p key={i} className="text-xs font-medium text-gray-400 uppercase tracking-wider">{item.section}</p>;
            }
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="flex gap-1">
                  {item.keys.map((k, j) => (
                    <kbd key={j} className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">{k}</kbd>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-gray-400 text-center">Pressione Esc ou clique fora para fechar</p>
      </div>
    </div>
  );
}
