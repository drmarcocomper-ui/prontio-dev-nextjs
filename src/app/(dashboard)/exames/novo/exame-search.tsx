"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { escapeLikePattern } from "@/lib/sanitize";

interface CatalogoExame {
  id: string;
  nome: string;
  codigo_tuss: string | null;
}

export function ExameSearch({
  onSelect,
}: {
  onSelect: (exame: CatalogoExame) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogoExame[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState(false);
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
        setSearchError(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("catalogo_exames")
        .select("id, nome, codigo_tuss")
        .ilike("nome", `%${escapeLikePattern(query)}%`)
        .order("nome")
        .limit(8);

      if (error) {
        setSearchError(true);
        setResults([]);
      } else {
        setSearchError(false);
        setResults(data ?? []);
      }
      setIsOpen(true);
      setActiveIndex(-1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function selectExame(exame: CatalogoExame) {
    onSelect(exame);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
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
          selectExame(results[activeIndex]);
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

  const listboxId = "exame-search-listbox";

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
          maxLength={100}
          placeholder="Buscar exame no catálogo..."
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `exame-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Resultados de exames"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.map((exame, index) => (
            <li
              key={exame.id}
              id={`exame-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onClick={() => selectExame(exame)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex ? "bg-primary-50" : "hover:bg-gray-50"
                }`}
              >
                <p className="font-medium text-gray-900">{exame.nome}</p>
                {exame.codigo_tuss && (
                  <p className="text-xs text-gray-500">
                    TUSS: {exame.codigo_tuss}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-4 text-center text-sm shadow-lg" role="status">
          {searchError ? (
            <span className="text-red-600">Erro ao buscar exames. Tente novamente.</span>
          ) : (
            <span className="text-gray-500">Nenhum exame encontrado.</span>
          )}
        </div>
      )}
    </div>
  );
}
