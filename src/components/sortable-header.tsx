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
    <th className={className ?? "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"}>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 hover:text-gray-900"
      >
        {label}
        <span
          className={
            isActive
              ? "text-gray-700"
              : "text-gray-300 group-hover:text-gray-400"
          }
        >
          {isActive
            ? currentDirection === "asc"
              ? " \u25B2"
              : " \u25BC"
            : " \u25B2"}
        </span>
      </Link>
    </th>
  );
}
