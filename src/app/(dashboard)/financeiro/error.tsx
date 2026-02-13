"use client";

import { ModuleError } from "@/components/module-error";

export default function FinanceiroError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/financeiro" backLabel="Voltar ao financeiro" />;
}
