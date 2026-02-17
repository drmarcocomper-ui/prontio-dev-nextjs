"use client";

import { ModuleError } from "@/components/module-error";

export default function RelatoriosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/" backLabel="Voltar ao painel" />;
}
