import Link from "next/link";
import { ProntuarioForm } from "./prontuario-form";

export default async function NovoProntuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente_id?: string; paciente_nome?: string }>;
}) {
  const { paciente_id, paciente_nome } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/prontuarios"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Prontuários
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Nova evolução
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <ProntuarioForm
          defaultPatientId={paciente_id}
          defaultPatientName={paciente_nome}
        />
      </div>
    </div>
  );
}
