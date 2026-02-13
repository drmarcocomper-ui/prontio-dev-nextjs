"use client";

import { ModuleError } from "@/components/module-error";

export default function ReceitasError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/receitas" backLabel="Voltar a receitas" />;
}
