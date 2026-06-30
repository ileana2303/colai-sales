"use client";

import type { CSSProperties } from "react";

import Link from "next/link";

import { AppIcon } from "@/components/ui/app-icon";
import AppLoader from "@/components/ui/AppLoader";
import { isAreaPickerUser } from "@/lib/managerPickerAccess";
import { AREA_REPORT_CATEGORIES } from "@/lib/bi-reports/reportCategories";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";

type ModuleCardProps = {
  accent: string;
  description: string;
  href: string;
  icon: string;
  title: string;
};

function ModuleCard({
  accent,
  description,
  href,
  icon,
  title,
}: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="home-module-card block h-full w-full no-underline text-inherit"
      aria-label={`${title} — μετάβαση`}
      style={{ "--home-module-accent": accent } as CSSProperties}
    >
      <div
        className="app-card app-card-pressable h-full w-full overflow-hidden"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div
          className="home-module-card__banner"
          style={{
            background: `linear-gradient(90deg, ${accent}40, ${accent}14)`,
            borderBottom: `3px solid ${accent}`,
          }}
        />
        <div className="home-module-card__body">
          <div className="home-module-card__content">
            <div
              className="home-module-card__icon"
              style={{
                borderColor: `${accent}55`,
                background: `linear-gradient(180deg, ${accent}24, ${accent}0a)`,
                color: accent,
              }}
            >
              <AppIcon name={icon} size={28} />
            </div>
            <div className="home-module-card__text">
              <div className="home-module-card__title">{title}</div>
              <div className="home-module-card__description">{description}</div>
            </div>
          </div>
          <AppIcon
            name="bi-chevron-right"
            className="home-module-card__chevron"
            size={24}
          />
        </div>
      </div>
    </Link>
  );
}

export default function HomeStats() {
  const userInfos = useAuthStore((s) => s.userInfos);
  const hydrated = useSelectedSellerStore((s) => s.hydrated);
  const selectedSeller = useSelectedSellerStore((s) => s.selectedSeller);
  const hasSellerCode = Boolean(normalizeSellerCode(userInfos?.sellerCode));
  const pickerUser = isAreaPickerUser(userInfos);
  const showAreaCategories = pickerUser
    ? Boolean(selectedSeller)
    : !hasSellerCode;

  if (pickerUser && !hydrated) {
    return <AppLoader label="Φόρτωση επιλογής πωλητή…" />;
  }

  if (pickerUser && !selectedSeller) {
    return null;
  }

  if (!showAreaCategories) {
    return (
      <div className="app-home-grid">
        <ModuleCard
          title="PowerBI . Sellers Reports"
          description="Αναφορές πωλήσεων."
          icon="bi-bar-chart"
          accent="#6366f1"
          href="/powerbi/seller-reports"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="app-home-grid">
        {AREA_REPORT_CATEGORIES.map((category) => (
          <ModuleCard
            key={category.key}
            title={category.title}
            description={category.description}
            icon={category.icon}
            accent={category.accent}
            href={category.href}
          />
        ))}
      </div>
    </div>
  );
}
