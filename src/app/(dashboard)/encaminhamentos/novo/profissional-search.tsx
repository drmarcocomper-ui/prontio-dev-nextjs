"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { escapeLikePattern } from "@/lib/sanitize";

interface ProfissionalResult {
  profissional_destino: string;
  especialidade: string;
  telefone_profissional: string | null;
}

export function ProfissionalSearch({
  onSelect,
  defaultValue,
}: {
  onSelect: (p: ProfissionalResult) => void;
  defaultValue?: string;
}) {
  const [query, setQuery] = useState(defaultValue ?? "");
  const [results, setResults] = useState<ProfissionalResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("encaminhamentos")
        .select("profissional_destino, especialidade, telefone_profissional")
        .ilike("profissional_destino", `%${escapeLikePattern(query)}%`)
        .order("profissional_destino")
        .limit(20);

      if (data) {
        // Deduplicate by profissional_destino + especialidade
        const seen = new Set<string>();
        const unique: ProfissionalResult[] = [];
        for (const item of data) {
          const key = `${item.profissional_destino}|${item.especialidade}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        setResults(unique.slice(0, 8));
      } else {
        setResults([]);
      }
      setIsOpen(true);
      setActiveIndex(-1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function selectProfissional(p: ProfissionalResult) {
    setQuery(p.profissional_destino);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(p);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          selectProfissional(results[activeIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView?.({ block: "nearest" });
    }
  }, [activeIndex]);

  const listboxId = "profissional-search-listbox";

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          maxLength={200}
          placeholder="Buscar profissional anterior..."
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `prof-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Profissionais anteriores"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.map((p, index) => (
            <li
              key={`${p.profissional_destino}-${p.especialidade}-${index}`}
              id={`prof-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onClick={() => selectProfissional(p)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex ? "bg-primary-50" : "hover:bg-gray-50"
                }`}
              >
                <span className="font-medium text-gray-900">{p.profissional_destino}</span>
                <span className="text-xs text-gray-500">{p.especialidade}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
