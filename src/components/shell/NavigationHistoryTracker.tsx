"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useNavigationHistoryStore } from "@/stores/navigationHistoryStore";

export function NavigationHistoryTracker() {
  const pathname = usePathname();
  const syncPath = useNavigationHistoryStore((state) => state.syncPath);

  useEffect(() => {
    syncPath(pathname);
  }, [pathname, syncPath]);

  return null;
}
