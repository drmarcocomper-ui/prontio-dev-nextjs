"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

interface SearchInputProps {
  basePath: string;
  placeholder: string;
  ariaLabel: string;
  defaultValue?: string;
}

export function SearchInput({ basePath, placeholder, ariaLabel, defaultValue }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerRef = useRef<NodeJS.Timeout>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue ?? "");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSearch(term: string) {
    setValue(term);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      params.delete("pagina");
      startTransition(() => {
        router.replace(`${basePath}?${params.toString()}`);
      });
    }, 300);
  }

  function handleClear() {
    setValue("");
    handleSearch("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <svg
        aria-hidden="true"
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        ref={inputRef}
        type="search"
        aria-label={ariaLabel}
        maxLength={100}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      {isPending ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div role="status" aria-label="Carregando" className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
        </div>
      ) : value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Limpar busca"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
