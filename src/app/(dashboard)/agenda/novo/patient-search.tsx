"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { escapeLikePattern } from "@/lib/sanitize";

interface Paciente {
  id: string;
  nome: string;
  cpf: string | null;
}

export function PatientSearch({
  defaultPatientId,
  defaultPatientName,
}: {
  defaultPatientId?: string;
  defaultPatientName?: string;
}) {
  const [query, setQuery] = useState(defaultPatientName ?? "");
  const [results, setResults] = useState<Paciente[]>([]);
  const [selectedId, setSelectedId] = useState(defaultPatientId ?? "");
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
        .from("pacientes")
        .select("id, nome, cpf")
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

  function selectPatient(p: Paciente) {
    setSelectedId(p.id);
    setQuery(p.nome);
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
          selectPatient(results[activeIndex]);
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

  function formatCPF(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  const listboxId = "patient-search-listbox";

  return (
    <div ref={wrapperRef} className="relative">
      <input type="hidden" name="paciente_id" value={selectedId} />
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
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedId) setSelectedId("");
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar paciente por nome..."
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `patient-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Resultados de pacientes"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.map((p, index) => (
            <li
              key={p.id}
              id={`patient-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onClick={() => selectPatient(p)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex ? "bg-sky-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  {p.nome
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{p.nome}</p>
                  {p.cpf && (
                    <p className="text-xs text-gray-500">
                      CPF: {formatCPF(p.cpf)}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-4 text-center text-sm shadow-lg" role="status">
          {searchError ? (
            <span className="text-red-600">Erro ao buscar pacientes. Tente novamente.</span>
          ) : (
            <span className="text-gray-500">Nenhum paciente encontrado.</span>
          )}
        </div>
      )}
    </div>
  );
}
