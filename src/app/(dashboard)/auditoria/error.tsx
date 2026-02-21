"use client";

import { ModuleError } from "@/components/module-error";

export default function AuditoriaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/auditoria" backLabel="Voltar à auditoria" />;
}
