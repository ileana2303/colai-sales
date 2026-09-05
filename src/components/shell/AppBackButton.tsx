"use client";

import { usePathname, useRouter } from "next/navigation";

import { AppIcon } from "@/components/ui/app-icon";
import { buttonVariants } from "@/components/ui/button";
import { getBackRoute, getRouteLabel } from "@/lib/navigation/backRoutes";
import { cn } from "@/lib/utils";
import { useNavigationHistoryStore } from "@/stores/navigationHistoryStore";

export function AppBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const previousPath = useNavigationHistoryStore((state) => {
    if (state.stack.length < 2) return null;
    return state.stack[state.stack.length - 2] ?? null;
  });

  if (!pathname || pathname === "/") return null;

  const fallbackRoute = getBackRoute(pathname);
  const backHref = previousPath ?? fallbackRoute?.href;
  const backLabel = previousPath
    ? getRouteLabel(previousPath)
    : fallbackRoute?.label;

  if (!backHref || !backLabel) return null;

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "app-header-back-button",
      )}
      onClick={() => router.push(backHref)}
    >
      <AppIcon name="bi-chevron-left" className="mr-1" size={16} />
      <span className="text-muted-foreground">Πίσω ·</span>
      <span>{backLabel}</span>
    </button>
  );
}
