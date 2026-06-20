"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppBackButton } from "@/components/shell/AppBackButton";
import { AppIcon } from "@/components/ui/app-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useAuthStore } from "@/stores/authStore";
import { ChevronDown } from "@/icons/lucide/chevron-down";
import type { ApiUserInfo } from "@/types/api/schemas";

function getInitials(userInfos: ApiUserInfo | null) {
  const first = userInfos?.fname?.trim()?.[0] ?? "";
  const last = userInfos?.lname?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}

function getRoleLabel(userInfos: ApiUserInfo | null) {
  if (!userInfos) return "Χρήστης";
  if (userInfos.isSuperAdmin) return "Super Admin";
  if (userInfos.isSalesAdmin) return "Sales Admin";
  if (userInfos.isManager) return "Manager";
  if (userInfos.isSeller) return "Seller";
  return "Χρήστης";
}

function getUserMeta(userInfos: ApiUserInfo | null) {
  if (!userInfos) return "Σύνδεση ενεργή";

  const parts = [
    userInfos.username?.trim(),
    userInfos.sellerCode?.trim() ? `Κωδ. ${userInfos.sellerCode.trim()}` : null,
    userInfos.area?.trim() || userInfos.team?.trim()
      ? [userInfos.area, userInfos.team].filter(Boolean).join(" · ")
      : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : getRoleLabel(userInfos);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logoutMutation = useLogout();
  const userInfos = useAuthStore((s) => s.userInfos);

  const fullName =
    [userInfos?.fname, userInfos?.lname].filter(Boolean).join(" ") ||
    "Λογαριασμός";

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const displayName = mounted ? fullName : "Λογαριασμός";
  const displayMeta = mounted ? getUserMeta(userInfos) : "Φόρτωση…";
  const initials = mounted ? getInitials(userInfos) : "?";

  const onLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.replace("/login");
    } catch (e) {}
  };

  return (
    <div className="app-viewport flex flex-col">
      <header className="app-header">
        <div className="app-header__inner">
          <Link
            href="/"
            className="app-logo-link"
            aria-label="Μετάβαση στην αρχική"
          >
            <Image
              src="/mono_logo.png"
              alt="App logo"
              width={132}
              height={30}
              priority
              style={{ height: 30, width: "auto" }}
            />
          </Link>

          <div className="app-header__actions">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="app-header-user"
                aria-label="User menu"
              >
                <span className="app-header-user__avatar" aria-hidden>
                  {initials}
                </span>
                <span className="app-header-user__text">
                  <span
                    className="app-header-user__name"
                    suppressHydrationWarning
                  >
                    {displayName}
                  </span>
                  <span
                    className="app-header-user__meta"
                    suppressHydrationWarning
                  >
                    {displayMeta}
                  </span>
                </span>
                <ChevronDown className="app-header-user__chevron" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{displayName}</span>
                      <span className="text-muted-foreground text-xs">
                        {displayMeta}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <AppIcon name="bi-gear" className="mr-2" size={14} />
                  Ρυθμίσεις
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout}>
                  <AppIcon
                    name="bi-box-arrow-right"
                    className="mr-2"
                    size={14}
                  />
                  Αποσύνδεση
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="app-content">
        <AppBackButton />
        {children}
      </main>
    </div>
  );
}
