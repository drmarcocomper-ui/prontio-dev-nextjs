"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OnlineRefresh() {
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("Conexão restaurada. Atualizando dados...");
      router.refresh();
    }
  }, [isOnline, router]);

  return null;
}
