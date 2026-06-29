import { AppIcon } from "@/components/ui/app-icon";
import { ReportHeader } from "@/features/powerBI/ReportShared";

type UnderConstructionReportPageProps = {
  brandLabel: string;
  caption?: string;
  icon?: string;
};

export function UnderConstructionReportPage({
  brandLabel,
  caption = "Target planning matrix",
  icon = "bi-gear",
}: UnderConstructionReportPageProps) {
  return (
    <div className="app-page">
      <ReportHeader
        badgeClassName=""
        icon={icon}
        subtitle={caption}
        title={brandLabel}
      />

      <section className="app-card flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
        <div
          className="inline-flex items-center justify-center rounded-2xl bg-muted text-muted-foreground"
          style={{ height: 72, width: 72 }}
        >
          <AppIcon name={icon} size={34} />
        </div>

        <div className="max-w-md">
          <h2 className="text-xl font-semibold">Under construction</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {brandLabel} reports are being prepared and will be available here
            soon.
          </p>
        </div>
      </section>
    </div>
  );
}
