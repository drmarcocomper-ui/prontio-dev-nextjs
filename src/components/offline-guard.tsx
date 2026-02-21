"use client";

import { useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function useOfflineGuard() {
  const isOnline = useOnlineStatus();

  const guardSubmit = useCallback(
    (e: FormEvent) => {
      if (!isOnline) {
        e.preventDefault();
        toast.error("Sem conexão com a internet. Não é possível salvar alterações offline.");
        return false;
      }
      return true;
    },
    [isOnline]
  );

  return { isOnline, guardSubmit };
}
