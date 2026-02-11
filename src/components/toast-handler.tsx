"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function ToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const success = searchParams.get("success");

  useEffect(() => {
    if (success) {
      toast.success(success);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [success, searchParams, router, pathname]);

  return null;
}
