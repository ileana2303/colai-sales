export type ReportCategoryKey =
  | "abbott"
  | "amoena"
  | "bbm"
  | "coloplast"
  | "covidien"
  | "genadyne"
  | "porges";

export type ReportCategoryStatus = "live" | "comingSoon";

export type ReportCategoryDefinition = {
  accent: string;
  backLabel: string;
  description: string;
  href: string;
  hubSubtitle: string;
  icon: string;
  key: ReportCategoryKey;
  status: ReportCategoryStatus;
  title: string;
  constructionMessage?: string;
};

export const AREA_REPORT_CATEGORIES: ReportCategoryDefinition[] = [
  {
    key: "covidien",
    title: "Covidien Reports",
    description: "PowerBI Reports for Covidien Sales & Trends.",
    hubSubtitle: "Επιλογή Covidien αναφοράς",
    href: "/powerbi/covidien-reports",
    icon: "bi-clipboard2-pulse",
    accent: "#2563eb",
    backLabel: "Covidien Reports",
    status: "live",
  },
  {
    key: "porges",
    title: "Porges Reports",
    description: "PowerBI Reports for Porges Sales & Trends.",
    hubSubtitle: "Επιλογή Porges αναφοράς",
    href: "/powerbi/porges-reports",
    icon: "bi-stars",
    accent: "#7c3aed",
    backLabel: "Porges Reports",
    status: "live",
  },
  {
    key: "bbm",
    title: "BAUSCH & LOMB TRIPLEX Reports",
    description: "PowerBI Reports for BAUSCH & LOMB TRIPLEX Sales & Trends.",
    hubSubtitle: "Επιλογή BAUSCH & LOMB Report",
    href: "/powerbi/BBM-reports",
    icon: "bi-bar-chart",
    accent: "#dc2626",
    backLabel: "BAUSCH & LOMB Reports",
    status: "live",
  },
  {
    key: "coloplast",
    title: "Coloplast Reports",
    description: "PowerBI Reports for Coloplast Sales & Trends.",
    hubSubtitle: "Επιλογή Coloplast αναφοράς",
    href: "/powerbi/coloplast-reports",
    icon: "bi-hospital",
    accent: "#0f766e",
    backLabel: "Coloplast Reports",
    status: "comingSoon",
    constructionMessage:
      "Οι αναφορές Coloplast βρίσκονται υπό κατασκευή. Σύντομα θα είναι διαθέσιμες sales, targets και trends.",
  },
  {
    key: "genadyne",
    title: "Genadyne Reports",
    description: "PowerBI Reports for Genadyne Sales & Forecast.",
    hubSubtitle: "Επιλογή Genadyne αναφοράς",
    href: "/powerbi/genadyne-reports",
    icon: "bi-graph-up-arrow",
    accent: "#16a34a",
    backLabel: "Genadyne Reports",
    status: "comingSoon",
    constructionMessage:
      "Οι αναφορές Genadyne βρίσκονται υπό κατασκευή. Σύντομα θα είναι διαθέσιμα sales, targets και forecast.",
  },
  {
    key: "amoena",
    title: "AMOENA Reports",
    description: "PowerBI Reports for AMOENA Sales & Trends.",
    hubSubtitle: "Επιλογή AMOENA αναφοράς",
    href: "/powerbi/amoena-reports",
    icon: "bi-people",
    accent: "#db2777",
    backLabel: "AMOENA Reports",
    status: "comingSoon",
    constructionMessage:
      "Οι αναφορές AMOENA βρίσκονται υπό κατασκευή. Σύντομα θα είναι διαθέσιμες sales, targets και trends.",
  },
  {
    key: "abbott",
    title: "ABBOTT Reports",
    description: "PowerBI Reports for ABBOTT Sales & Trends.",
    hubSubtitle: "Επιλογή ABBOTT αναφοράς",
    href: "/powerbi/abbott-reports",
    icon: "bi-building-2",
    accent: "#0369a1",
    backLabel: "ABBOTT Reports",
    status: "comingSoon",
    constructionMessage:
      "Οι αναφορές ABBOTT βρίσκονται υπό κατασκευή. Σύντομα θα είναι διαθέσιμες sales, targets και trends.",
  },
];

export function getReportCategory(key: ReportCategoryKey) {
  const category = AREA_REPORT_CATEGORIES.find((item) => item.key === key);
  if (!category) {
    throw new Error(`Unknown report category: ${key}`);
  }

  return category;
}
