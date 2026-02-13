"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
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
            // Wait for next key
            waitForNextKey((next) => {
              switch (next) {
                case "h": router.push("/"); break;
                case "p": router.push("/pacientes"); break;
                case "a": router.push("/agenda"); break;
                case "e": router.push("/prontuarios"); break;
                case "f": router.push("/financeiro"); break;
                case "c": router.push("/configuracoes"); break;
              }
            });
            break;
          case "?":
            // Show shortcuts help
            toggleShortcutsHelp();
            break;
        }
      }
    }

    let nextKeyTimeout: ReturnType<typeof setTimeout> | null = null;
    let nextKeyHandler: ((key: string) => void) | null = null;

    function waitForNextKey(handler: (key: string) => void) {
      nextKeyHandler = handler;
      nextKeyTimeout = setTimeout(() => {
        nextKeyHandler = null;
      }, 1000);
    }

    function handleNextKey(e: KeyboardEvent) {
      if (nextKeyHandler) {
        e.preventDefault();
        const handler = nextKeyHandler;
        nextKeyHandler = null;
        if (nextKeyTimeout) clearTimeout(nextKeyTimeout);
        handler(e.key);
      }
    }

    function toggleShortcutsHelp() {
      const existing = document.getElementById("shortcuts-help");
      if (existing) {
        existing.remove();
        return;
      }

      const overlay = document.createElement("div");
      overlay.id = "shortcuts-help";
      overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in";
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };

      overlay.innerHTML = `
        <div class="animate-scale-in mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h2 class="text-lg font-bold text-gray-900">Atalhos de teclado</h2>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Buscar</span>
              <kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">Ctrl + K</kbd>
            </div>
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Navegação (g + tecla)</p>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Painel</span>
              <span class="flex gap-1"><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">g</kbd><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">h</kbd></span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Pacientes</span>
              <span class="flex gap-1"><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">g</kbd><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">p</kbd></span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Agenda</span>
              <span class="flex gap-1"><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">g</kbd><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">a</kbd></span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Prontuários</span>
              <span class="flex gap-1"><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">g</kbd><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">e</kbd></span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Financeiro</span>
              <span class="flex gap-1"><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">g</kbd><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">f</kbd></span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Configurações</span>
              <span class="flex gap-1"><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">g</kbd><kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">c</kbd></span>
            </div>
            <hr class="border-gray-200" />
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Esta ajuda</span>
              <kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">?</kbd>
            </div>
          </div>
          <p class="mt-4 text-xs text-gray-400 text-center">Pressione Esc ou clique fora para fechar</p>
        </div>
      `;

      document.body.appendChild(overlay);
    }

    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        const help = document.getElementById("shortcuts-help");
        if (help) {
          help.remove();
          return;
        }
      }
      if (nextKeyHandler) {
        handleNextKey(e);
        return;
      }
      handleKeyDown(e);
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      if (nextKeyTimeout) clearTimeout(nextKeyTimeout);
    };
  }, [router]);

  return null;
}
