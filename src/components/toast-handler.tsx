"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

const MAX_MSG_LENGTH = 100;

function sanitizeMessage(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").slice(0, MAX_MSG_LENGTH);
}

export function ToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const success = searchParams.get("success");

  useEffect(() => {
    if (success) {
      toast.success(sanitizeMessage(success));
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [success, searchParams, router, pathname]);

  return null;
}
