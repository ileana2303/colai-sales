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
