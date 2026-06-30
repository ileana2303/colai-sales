export type ReportCategoryKey =
  | "abbott"
  | "amoena"
  | "bbm"
  | "coloplast-travma"
  | "covidien"
  | "coloplast-akrateia"
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
    key: "coloplast-travma",
    title: "Coloplast: Τραύμα",
    description: "PowerBI Reports for Coloplast Sales & Trends.",
    href: "/powerbi/coloplast-reports",
    icon: "bi-hospital",
    accent: "#1CB3A7",
  },
  {
    key: "coloplast-akrateia",
    title: "Coloplast: Ακράτεια",
    description: "PowerBI Reports for Akrateia Sales & Forecast.",
    href: "/powerbi/akrateia-reports",
    icon: "bi-graph-up-arrow",
    accent: "#1AB7CF",
  },
  {
    key: "amoena",
    title: "AMOENA",
    description: "PowerBI Reports for AMOENA Sales & Trends.",
    href: "/powerbi/amoena-reports",
    icon: "bi-people",
    accent: "#017FAA",
  },
  {
    key: "abbott",
    title: "ABBOTT",
    description: "PowerBI Reports for ABBOTT Sales & Trends.",
    href: "/powerbi/abbott-reports",
    icon: "bi-building-2",
    accent: "#003175",
  },
  {
    key: "porges",
    title: "Porges",
    description: "PowerBI Reports for Porges Sales & Trends.",
    href: "/powerbi/porges-reports",
    icon: "bi-stars",
    accent: "#7c3aed",
  },
  {
    key: "bbm",
    title: "Bausch & Lomb",
    description: "PowerBI Reports for BAUSCH & LOMB Sales & Trends.",
    href: "/powerbi/BBM-reports",
    icon: "bi-bar-chart",
    accent: "#5BC6E8",
  },
  {
    key: "covidien",
    title: "Covidien",
    description: "PowerBI Reports for Covidien Sales & Trends.",
    href: "/powerbi/covidien-reports",
    icon: "bi-clipboard2-pulse",
    accent: "#C3DBEE",
  },
];

export function getReportCategory(key: ReportCategoryKey) {
  const category = AREA_REPORT_CATEGORIES.find((item) => item.key === key);
  if (!category) {
    throw new Error(`Unknown report category: ${key}`);
  }

  return category;
}
