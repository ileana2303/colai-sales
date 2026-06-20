"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon } from "@/components/ui/app-icon";
import { buttonVariants } from "@/components/ui/button";
import { getBackRoute } from "@/lib/navigation/backRoutes";
import { cn } from "@/lib/utils";

export function AppBackButton() {
  const pathname = usePathname();
  const backRoute = getBackRoute(pathname);

  if (!backRoute) return null;

  return (
    <Link
      href={backRoute.href}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "app-back-button self-start",
      )}
    >
      <AppIcon name="bi-chevron-left" className="mr-1.5" size={16} />
      <span className="text-muted-foreground">Πίσω ·</span>
      <span>{backRoute.label}</span>
    </Link>
  );
}
