"use client";

import { ModuleError } from "@/components/module-error";

export default function PacientesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/pacientes" backLabel="Voltar a pacientes" />;
}
