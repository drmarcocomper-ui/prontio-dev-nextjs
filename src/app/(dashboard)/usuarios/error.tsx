"use client";

import { ModuleError } from "@/components/module-error";

export default function UsuariosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError reset={reset} backHref="/usuarios" backLabel="Voltar a usuários" />;
}
