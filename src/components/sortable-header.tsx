"use client";

import Link from "next/link";

interface SortableHeaderProps {
  label: string;
  column: string;
  currentColumn: string;
  currentDirection: "asc" | "desc";
  basePath: string;
  searchParams: Record<string, string>;
  className?: string;
}

export function SortableHeader({
  label,
  column,
  currentColumn,
  currentDirection,
  basePath,
  searchParams,
  className,
}: SortableHeaderProps) {
  const isActive = currentColumn === column;
  const nextDirection = isActive && currentDirection === "asc" ? "desc" : "asc";

  const params = new URLSearchParams(searchParams);
  params.set("ordem", column);
  params.set("dir", nextDirection);
  params.delete("pagina");
  const qs = params.toString();
  const href = qs ? `${basePath}?${qs}` : basePath;

  return (
    <th scope="col" aria-sort={isActive ? (currentDirection === "asc" ? "ascending" : "descending") : "none"} className={className ?? "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"}>
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 transition-colors hover:text-gray-900"
      >
        {label}
        <span className={`inline-flex flex-col gap-0.5 ${isActive ? "text-primary-600" : "text-gray-300 group-hover:text-gray-400"}`}>
          <svg
            aria-hidden="true"
            className={`h-3 w-3 transition-colors ${isActive && currentDirection === "asc" ? "text-primary-600" : ""}`}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 3l5 5H3l5-5z" />
          </svg>
          <svg
            aria-hidden="true"
            className={`-mt-1 h-3 w-3 transition-colors ${isActive && currentDirection === "desc" ? "text-primary-600" : ""}`}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 13l5-5H3l5 5z" />
          </svg>
        </span>
      </Link>
    </th>
  );
}
