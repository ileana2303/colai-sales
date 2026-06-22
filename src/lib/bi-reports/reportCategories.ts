export type ReportCategoryKey =
  | "abbott"
  | "amoena"
  | "bbm"
  | "coloplast"
  | "covidien"
  | "genadyne"
  | "porges";

export type ReportCategoryDefinition = {
  accent: string;
  description: string;
  href: string;
  icon: string;
  key: ReportCategoryKey;
  title: string;
};

export const AREA_REPORT_CATEGORIES: ReportCategoryDefinition[] = [
  {
    key: "covidien",
    title: "Covidien Reports",
    description: "PowerBI Reports for Covidien Sales & Trends.",
    href: "/powerbi/covidien-reports",
    icon: "bi-clipboard2-pulse",
    accent: "#2563eb",
  },
  {
    key: "porges",
    title: "Porges Reports",
    description: "PowerBI Reports for Porges Sales & Trends.",
    href: "/powerbi/porges-reports",
    icon: "bi-stars",
    accent: "#7c3aed",
  },
  {
    key: "bbm",
    title: "BAUSCH & LOMB TRIPLEX Reports",
    description: "PowerBI Reports for BAUSCH & LOMB TRIPLEX Sales & Trends.",
    href: "/powerbi/BBM-reports",
    icon: "bi-bar-chart",
    accent: "#dc2626",
  },
  {
    key: "coloplast",
    title: "Coloplast Reports",
    description: "PowerBI Reports for Coloplast Sales & Trends.",
    href: "/powerbi/coloplast-reports",
    icon: "bi-hospital",
    accent: "#0f766e",
  },
  {
    key: "genadyne",
    title: "Genadyne Reports",
    description: "PowerBI Reports for Genadyne Sales & Forecast.",
    href: "/powerbi/genadyne-reports",
    icon: "bi-graph-up-arrow",
    accent: "#16a34a",
  },
  {
    key: "amoena",
    title: "AMOENA Reports",
    description: "PowerBI Reports for AMOENA Sales & Trends.",
    href: "/powerbi/amoena-reports",
    icon: "bi-people",
    accent: "#db2777",
  },
  {
    key: "abbott",
    title: "ABBOTT Reports",
    description: "PowerBI Reports for ABBOTT Sales & Trends.",
    href: "/powerbi/abbott-reports",
    icon: "bi-building-2",
    accent: "#0369a1",
  },
];

export function getReportCategory(key: ReportCategoryKey) {
  const category = AREA_REPORT_CATEGORIES.find((item) => item.key === key);
  if (!category) {
    throw new Error(`Unknown report category: ${key}`);
  }

  return category;
}
