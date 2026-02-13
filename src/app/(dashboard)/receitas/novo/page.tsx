import type { Metadata } from "next";
import Link from "next/link";
import { ReceitaForm } from "./receita-form";

export const metadata: Metadata = { title: "Nova Receita" };

export default async function NovaReceitaPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente_id?: string; paciente_nome?: string }>;
}) {
  const { paciente_id, paciente_nome } = await searchParams;

  const fromPaciente = !!paciente_id;
  const backHref = fromPaciente ? `/pacientes/${paciente_id}` : "/receitas";
  const backLabel = fromPaciente ? (paciente_nome ?? "Paciente") : "Receitas";

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          {backLabel}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Nova receita
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <ReceitaForm
          defaults={
            paciente_id
              ? { paciente_id, paciente_nome }
              : undefined
          }
          cancelHref={fromPaciente ? `/pacientes/${paciente_id}` : undefined}
        />
      </div>
    </div>
  );
}
