"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";

type ModuleCardProps = {
  title: string;
  description: string;
  icon: string;
  href: string;
};

function ModuleCard({ title, description, icon, href }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="block h-full no-underline text-inherit"
      aria-label={`${title} — μετάβαση`}
    >
      <div
        className="app-card app-card-pressable h-full p-5"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div
            className="flex min-w-0 grow items-center gap-4"
          >
            <div className="home-module-card__icon">
              <AppIcon name={icon} size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold leading-tight">{title}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">
                {description}
              </div>
            </div>
          </div>
          <AppIcon
            name="bi-chevron-right"
            className="shrink-0 text-muted-foreground"
            size={20}
          />
        </div>
      </div>
    </Link>
  );
}

export default function HomeStats() {
  const userInfos = useAuthStore((s) => s.userInfos);
  const hasSellerCode = Boolean(normalizeSellerCode(userInfos?.sellerCode));

  return hasSellerCode ? (
    <div className="app-home-grid">
      <ModuleCard
        title="PowerBI . Sellers Reports"
        description="Αναφορές πωλήσεων και διαθέσιμα datasets."
        icon="bi-bar-chart"
        href="/powerbi/seller-reports"
      />
      <ModuleCard
        title="Power BI Groups"
        description="Workspaces και datasets του tenant."
        icon="bi-grid-3x3-gap"
        href="/powerbi/groups"
      />
    </div>
  ) : (
    <div className="app-home-grid">
      <ModuleCard
        title="Covidien Reports"
        description="PowerBI Reports for Covidien Sales & Trends."
        icon="bi-bar-chart"
        href="/powerbi/covidien-reports"
      />
      <ModuleCard
        title="BAUSCH & LOMB TRIPLEX Reports"
        description="PowerBI Reports for BAUSCH & LOMB TRIPLEX Sales & Trends."
        icon="bi-bar-chart"
        href="/powerbi/BBM-reports"
      />
    </div>
  );
}
