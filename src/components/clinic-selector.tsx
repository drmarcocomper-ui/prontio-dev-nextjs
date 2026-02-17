"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Clinica } from "@/lib/clinica";

interface ClinicSelectorProps {
  clinicas: Clinica[];
  clinicaAtualId: string;
}

export function ClinicSelector({ clinicas, clinicaAtualId }: ClinicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  const current = clinicas.find((c) => c.id === clinicaAtualId) ?? clinicas[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset active index when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const idx = clinicas.findIndex((c) => c.id === clinicaAtualId);
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, clinicas, clinicaAtualId]);

  // Scroll active option into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const option = listRef.current.children[activeIndex] as HTMLElement | undefined;
      option?.scrollIntoView?.({ block: "nearest" });
    }
  }, [isOpen, activeIndex]);

  const handleSelect = useCallback(
    async (clinicaId: string) => {
      setIsOpen(false);
      if (clinicaId === clinicaAtualId) return;

      await fetch("/api/clinica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicaId }),
      });

      router.refresh();
    },
    [clinicaAtualId, router],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % clinicas.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + clinicas.length) % clinicas.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < clinicas.length) {
          handleSelect(clinicas[activeIndex].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(clinicas.length - 1);
        break;
    }
  }

  if (clinicas.length <= 1) {
    return (
      <div className="mx-3 mb-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <p className="truncate text-sm font-medium text-gray-900">{current?.nome ?? "Clínica"}</p>
      </div>
    );
  }

  const listboxId = "clinic-selector-listbox";

  return (
    <div ref={ref} className="relative mx-3 mb-2">
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `clinic-option-${clinicas[activeIndex].id}` : undefined}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:bg-gray-100"
      >
        <span className="truncate text-sm font-medium text-gray-900">{current?.nome ?? "Clínica"}</span>
        <svg
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label="Selecionar clínica"
          className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {clinicas.map((c, i) => (
            <li
              key={c.id}
              id={`clinic-option-${c.id}`}
              role="option"
              aria-selected={c.id === clinicaAtualId}
              onClick={() => handleSelect(c.id)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                i === activeIndex ? "bg-gray-100" : ""
              } ${c.id === clinicaAtualId ? "font-medium text-primary-700" : "text-gray-700"}`}
            >
              <span className="truncate">{c.nome}</span>
              {c.id === clinicaAtualId && (
                <svg aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
