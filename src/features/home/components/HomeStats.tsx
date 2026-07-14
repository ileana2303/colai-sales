"use client";

import type { CSSProperties } from "react";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { AppIcon } from "@/components/ui/app-icon";
import AppLoader from "@/components/ui/AppLoader";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { fetchAreaCategoryTargets } from "@/lib/api/powerbi";
import { isAreaPickerUser } from "@/lib/managerPickerAccess";
import {
  AREA_REPORT_CATEGORIES,
  type ReportCategoryKey,
} from "@/lib/bi-reports/reportCategories";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";

const AREA_REPORT_CATEGORY_IMAGES: Partial<Record<ReportCategoryKey, string>> =
  {
    "coloplast-travma": "/images/brands/coloplast-logo.png",
    "coloplast-akrateia": "/images/brands/coloplast-logo.png",
    amoena: "/images/brands/amoena-logo.png",
    abbott: "/images/brands/abbott_logo.png",
    bbm: "/images/brands/BBM-logo.png",
    covidien: "/images/brands/covidien-logo.png",
    porges: "/images/brands/porges-logo.png",
  };

type ModuleCardProps = {
  accent: string;
  brandImagePath?: string;
  description: string;
  href: string;
  icon: string;
  title: string;
};

function ModuleCard({
  accent,
  brandImagePath,
  description,
  href,
  icon,
  title,
}: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="home-module-card block h-full w-full text-inherit no-underline"
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
              {brandImagePath ? (
                <Image
                  src={brandImagePath}
                  alt={`${title} logo`}
                  width={68}
                  height={68}
                  unoptimized
                  className="home-module-card__brand-image"
                />
              ) : (
                <AppIcon name={icon} size={28} />
              )}
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
  const area = pickerUser
    ? selectedSeller?.area?.trim() || ""
    : userInfos?.area?.trim() || "";
  const {
    data: categoryTargets,
    isLoading: isLoadingCategoryTargets,
  } = useQuery({
    queryKey: powerBiKeys.areaCategoryTargets(area),
    queryFn: fetchAreaCategoryTargets,
    enabled: showAreaCategories && Boolean(area),
  });

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

  if (isLoadingCategoryTargets) {
    return <AppLoader label="Φόρτωση διαθέσιμων αναφορών…" />;
  }

  const visibleCategories = AREA_REPORT_CATEGORIES.filter(
    (category) => categoryTargets?.record?.[category.key] != null,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="app-home-grid">
        {visibleCategories.map((category) => (
          <ModuleCard
            key={category.key}
            title={category.title}
            description={category.description}
            brandImagePath={AREA_REPORT_CATEGORY_IMAGES[category.key]}
            icon={category.icon}
            accent={category.accent}
            href={category.href}
          />
        ))}
      </div>
    </div>
  );
}
