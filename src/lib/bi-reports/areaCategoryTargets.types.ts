import type { ReportCategoryKey } from "@/lib/bi-reports/reportCategories.types";

export type AreaCategoryTargetsRow = {
  area: string;
} & Partial<Record<ReportCategoryKey, number | null>>;
