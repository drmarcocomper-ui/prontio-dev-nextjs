"use client";

import { ModuleError } from "@/components/module-error";

export default function ProntuariosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/prontuarios" backLabel="Voltar a prontuários" />;
}
