"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscaGlobal, type SearchResult, type SearchResults } from "@/app/(dashboard)/busca-global/actions";

const MODULE_ICONS: Record<string, string> = {
  Pacientes: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  Agenda: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
  "Prontuários": "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  Receitas: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z",
  Exames: "M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.341 4.023A2.25 2.25 0 0 1 15.523 20H8.477a2.25 2.25 0 0 1-2.136-1.477L5 14.5m14 0-3.36-1.68a1.5 1.5 0 0 0-1.28 0L12 14l-2.36-1.18a1.5 1.5 0 0 0-1.28 0L5 14.5",
};

function getAllResults(results: SearchResults): SearchResult[] {
  return [
    ...results.pacientes,
    ...results.agendamentos,
    ...results.prontuarios,
    ...results.receitas,
    ...results.exames,
  ];
}

function getModuleGroups(results: SearchResults): { module: string; items: SearchResult[] }[] {
  const groups: { module: string; items: SearchResult[] }[] = [];
  if (results.pacientes.length > 0) groups.push({ module: "Pacientes", items: results.pacientes });
  if (results.agendamentos.length > 0) groups.push({ module: "Agenda", items: results.agendamentos });
  if (results.prontuarios.length > 0) groups.push({ module: "Prontuários", items: results.prontuarios });
  if (results.receitas.length > 0) groups.push({ module: "Receitas", items: results.receitas });
  if (results.exames.length > 0) groups.push({ module: "Exames", items: results.exames });
  return groups;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(null);
    setSelectedIndex(0);
  }, []);

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults(null);
      setSelectedIndex(0);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await buscaGlobal(query);
        setResults(res);
        setSelectedIndex(0);
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const allItems = results ? getAllResults(results) : [];

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(1, allItems.length));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + allItems.length) % Math.max(1, allItems.length));
        break;
      case "Enter":
        e.preventDefault();
        if (allItems[selectedIndex]) {
          router.push(allItems[selectedIndex].href);
          close();
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  }

  if (!open) return null;

  const groups = results ? getModuleGroups(results) : [];
  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
        className="relative mx-4 w-full max-w-lg animate-scale-in overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        {/* Search input */}
        <div className="flex items-center border-b border-gray-200 px-4">
          <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar pacientes, agendamentos, prontuários..."
            className="w-full border-0 bg-transparent px-3 py-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-0"
          />
          {isPending && (
            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
          )}
          <kbd className="ml-2 hidden shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-500 sm:inline-block">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto overscroll-contain">
          {query.length >= 2 && results && allItems.length === 0 && !isPending && (
            <div className="px-6 py-10 text-center">
              <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">
                Nenhum resultado para &quot;{query}&quot;
              </p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.module}>
              <div className="sticky top-0 bg-gray-50 px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.module}
                </p>
              </div>
              <ul>
                {group.items.map((item) => {
                  const idx = globalIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          router.push(item.href);
                          close();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected ? "bg-primary-50 text-primary-900" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <svg
                          className={`h-5 w-5 shrink-0 ${isSelected ? "text-primary-500" : "text-gray-400"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={MODULE_ICONS[item.module] ?? MODULE_ICONS.Pacientes} />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className={`truncate text-xs ${isSelected ? "text-primary-600" : "text-gray-500"}`}>
                            {item.subtitle}
                          </p>
                        </div>
                        {isSelected && (
                          <kbd className="hidden shrink-0 rounded bg-primary-100 px-1.5 py-0.5 text-xs font-mono text-primary-600 sm:inline-block">
                            Enter
                          </kbd>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[10px]">&uarr;</kbd>
              <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[10px]">&darr;</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
              abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
              fechar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
