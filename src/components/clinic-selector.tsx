"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Clinica } from "@/lib/clinica";

interface ClinicSelectorProps {
  clinicas: Clinica[];
  clinicaAtualId: string;
}

export function ClinicSelector({ clinicas, clinicaAtualId }: ClinicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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

  if (clinicas.length <= 1) {
    return (
      <div className="mx-3 mb-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <p className="truncate text-sm font-medium text-gray-900">{current?.nome ?? "Clínica"}</p>
      </div>
    );
  }

  async function handleSelect(clinicaId: string) {
    setIsOpen(false);
    if (clinicaId === clinicaAtualId) return;

    await fetch("/api/clinica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicaId }),
    });

    router.refresh();
  }

  return (
    <div ref={ref} className="relative mx-3 mb-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {clinicas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                c.id === clinicaAtualId ? "bg-primary-50 font-medium text-primary-700" : "text-gray-700"
              }`}
            >
              <span className="truncate">{c.nome}</span>
              {c.id === clinicaAtualId && (
                <svg aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
