import { AppIcon } from "@/components/ui/app-icon";
import type { ReportCategoryDefinition } from "@/lib/bi-reports/reportCategories";

type ReportCategoryBannerProps = {
  category: ReportCategoryDefinition;
};

export function ReportCategoryBanner({ category }: ReportCategoryBannerProps) {
  return (
    <section className="app-card overflow-hidden p-0">
      <div
        className="report-category-banner__strip"
        style={{
          background: `linear-gradient(90deg, ${category.accent}33, ${category.accent}12)`,
          borderBottom: `3px solid ${category.accent}`,
        }}
      />
      <div className="report-category-banner__body">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 grow">
            <div className="flex flex-nowrap items-center gap-2.5">
              <h1 className="app-report-title mb-0 min-w-0 truncate">
                {category.title}
              </h1>
              <span
                className="inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[11px] leading-none font-medium"
                style={{
                  backgroundColor: "#f2c811",
                  border: "1px solid #d9b30d",
                  color: "#1f1f1f",
                }}
              >
                PowerBI
              </span>
            </div>
            <div className="app-report-subtitle">{category.hubSubtitle}</div>
          </div>
          <div
            className="report-category-banner__icon inline-flex shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `${category.accent}18`,
              color: category.accent,
              border: `1px solid ${category.accent}33`,
            }}
          >
            <AppIcon name={category.icon} size={26} />
          </div>
        </div>
      </div>
    </section>
  );
}
