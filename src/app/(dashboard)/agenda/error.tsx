"use client";

import { ModuleError } from "@/components/module-error";

export default function AgendaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/agenda" backLabel="Voltar à agenda" />;
}
