import { AppIcon } from "@/components/ui/app-icon";
import type { ReportCategoryDefinition } from "@/lib/bi-reports/reportCategories";

type UnderConstructionViewProps = {
  category: ReportCategoryDefinition;
};

export function UnderConstructionView({
  category,
}: UnderConstructionViewProps) {
  return (
    <section className="app-card p-8 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="relative">
          <div
            className="inline-flex items-center justify-center rounded-2xl"
            style={{
              width: 88,
              height: 88,
              background: `${category.accent}18`,
              color: category.accent,
              border: `1px solid ${category.accent}33`,
            }}
          >
            <AppIcon name={category.icon} size={40} />
          </div>
          <span
            className="bg-muted text-muted-foreground absolute -right-2 -bottom-2 inline-flex items-center justify-center rounded-full p-2 shadow-sm"
            aria-hidden
          >
            <AppIcon name="bi-construction" size={18} />
          </span>
        </div>

        <div>
          <h2 className="text-3xl font-semibold">Υπό κατασκευή</h2>
          <p className="text-muted-foreground mt-2 text-xl">
            {category.constructionMessage ??
              `Οι ${category.title} βρίσκονται υπό κατασκευή.`}
          </p>
        </div>
      </div>
    </section>
  );
}
