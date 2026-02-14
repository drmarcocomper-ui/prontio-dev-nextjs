import Link from "next/link";

export type IllustrationType = "pacientes" | "agenda" | "prontuarios" | "receitas" | "financeiro" | "usuarios";

interface EmptyStateProps {
  icon: IllustrationType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

function PacientesIllustration() {
  return (
    <svg aria-hidden="true" className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="48" className="fill-primary-50" />
      <circle cx="48" cy="36" r="12" className="stroke-primary-300" strokeWidth="2" fill="none" />
      <path d="M28 68c0-11.046 8.954-20 20-20s20 8.954 20 20" className="stroke-primary-300" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="68" cy="40" r="6" className="stroke-primary-200" strokeWidth="1.5" fill="none" />
      <path d="M60 56c0-5 3.6-8 8-8" className="stroke-primary-200" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="48" cy="36" r="3" className="fill-primary-200" />
    </svg>
  );
}

function AgendaIllustration() {
  return (
    <svg aria-hidden="true" className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="48" className="fill-primary-50" />
      <rect x="22" y="26" width="52" height="48" rx="6" className="stroke-primary-300" strokeWidth="2" fill="none" />
      <path d="M22 38h52" className="stroke-primary-300" strokeWidth="2" />
      <rect x="34" y="28" width="2" height="8" rx="1" className="fill-primary-300" />
      <rect x="60" y="28" width="2" height="8" rx="1" className="fill-primary-300" />
      <circle cx="36" cy="50" r="3" className="fill-primary-200" />
      <circle cx="48" cy="50" r="3" className="fill-primary-200" />
      <circle cx="60" cy="50" r="3" className="fill-primary-100" />
      <circle cx="36" cy="62" r="3" className="fill-primary-100" />
      <circle cx="48" cy="62" r="3" className="fill-primary-100" />
    </svg>
  );
}

function ProntuariosIllustration() {
  return (
    <svg aria-hidden="true" className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="48" className="fill-primary-50" />
      <rect x="28" y="20" width="40" height="56" rx="4" className="stroke-primary-300" strokeWidth="2" fill="none" />
      <path d="M36 34h24M36 42h18M36 50h20M36 58h12" className="stroke-primary-200" strokeWidth="2" strokeLinecap="round" />
      <circle cx="62" cy="62" r="10" className="fill-white stroke-primary-300" strokeWidth="2" />
      <path d="M59 62h6M62 59v6" className="stroke-primary-500" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ReceitasIllustration() {
  return (
    <svg aria-hidden="true" className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="48" className="fill-primary-50" />
      <rect x="24" y="22" width="36" height="52" rx="4" className="stroke-primary-300" strokeWidth="2" fill="none" />
      <path d="M32 34h20M32 42h16M32 50h18" className="stroke-primary-200" strokeWidth="2" strokeLinecap="round" />
      <rect x="46" y="34" width="26" height="40" rx="4" className="fill-white stroke-primary-300" strokeWidth="2" />
      <path d="M54 46h10M54 54h8M54 62h6" className="stroke-primary-200" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FinanceiroIllustration() {
  return (
    <svg aria-hidden="true" className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="48" className="fill-primary-50" />
      <rect x="22" y="68" width="10" height="14" rx="2" className="fill-primary-200" />
      <rect x="36" y="54" width="10" height="28" rx="2" className="fill-primary-200" />
      <rect x="50" y="42" width="10" height="40" rx="2" className="fill-primary-300" />
      <rect x="64" y="32" width="10" height="50" rx="2" className="fill-primary-200" />
      <path d="M24 62l14-12 14-6 14-12" className="stroke-primary-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="62" r="3" className="fill-primary-500" />
      <circle cx="38" cy="50" r="3" className="fill-primary-500" />
      <circle cx="52" cy="44" r="3" className="fill-primary-500" />
      <circle cx="66" cy="32" r="3" className="fill-primary-500" />
    </svg>
  );
}

function UsuariosIllustration() {
  return (
    <svg aria-hidden="true" className="h-24 w-24" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="48" className="fill-primary-50" />
      <circle cx="36" cy="36" r="10" className="stroke-primary-300" strokeWidth="2" fill="none" />
      <path d="M20 62c0-8.837 7.163-16 16-16s16 8.837 16 16" className="stroke-primary-300" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="38" r="7" className="stroke-primary-200" strokeWidth="1.5" fill="none" />
      <path d="M50 58c0-5.523 4.477-10 10-10" className="stroke-primary-200" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="70" cy="56" r="10" className="fill-white stroke-primary-400" strokeWidth="2" />
      <path d="M67 56h6M70 53v6" className="stroke-primary-500" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyStateIllustration({ type }: { type: IllustrationType }) {
  const Component = illustrations[type];
  return <Component />;
}

const illustrations = {
  pacientes: PacientesIllustration,
  agenda: AgendaIllustration,
  prontuarios: ProntuariosIllustration,
  receitas: ReceitasIllustration,
  financeiro: FinanceiroIllustration,
  usuarios: UsuariosIllustration,
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  const Illustration = illustrations[icon];

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-16 text-center">
      <Illustration />
      <h3 className="mt-6 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
