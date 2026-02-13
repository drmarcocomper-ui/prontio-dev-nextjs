import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link
        href="/"
        className="text-gray-400 transition-colors hover:text-gray-600"
        aria-label="Início"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <svg aria-hidden="true" className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          {item.href ? (
            <Link
              href={item.href}
              className="text-gray-500 transition-colors hover:text-gray-700"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
