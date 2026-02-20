"use client";

import { ModuleError } from "@/components/module-error";

export default function EncaminhamentosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/encaminhamentos" backLabel="Voltar a encaminhamentos" />;
}
