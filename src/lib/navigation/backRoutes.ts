export type BackRoute = {
  href: string;
  label: string;
};

const EXACT_BACK_ROUTES: Record<string, BackRoute> = {
  "/settings": { href: "/", label: "Αρχική" },
  "/powerbi/seller-reports": { href: "/", label: "Αρχική" },
  "/powerbi/seller-reports/akrateia": {
    href: "/powerbi/seller-reports",
    label: "Seller Reports",
  },
  "/powerbi/seller-reports/sales-per-month": {
    href: "/powerbi/seller-reports",
    label: "Seller Reports",
  },
  "/powerbi/seller-reports/sales-per-year": {
    href: "/powerbi/seller-reports",
    label: "Seller Reports",
  },
  "/powerbi/covidien-reports": { href: "/", label: "Αρχική" },
  "/powerbi/BBM-reports": { href: "/", label: "Αρχική" },
  "/powerbi/porges-reports": { href: "/", label: "Αρχική" },
  "/powerbi/coloplast-reports": { href: "/", label: "Αρχική" },
  "/powerbi/genadyne-reports": { href: "/", label: "Αρχική" },
  "/powerbi/amoena-reports": { href: "/", label: "Αρχική" },
  "/powerbi/abbott-reports": { href: "/", label: "Αρχική" },
  "/salesWC": { href: "/", label: "Αρχική" },
  "/diadikasia-wc": { href: "/", label: "Αρχική" },
};

const PATTERN_BACK_ROUTES: Array<{
  pattern: RegExp;
  route: BackRoute;
}> = [];

const PARENT_LABELS: Record<string, string> = {
  "/powerbi/seller-reports": "Seller Reports",
  "/powerbi/covidien-reports": "Covidien Reports",
  "/powerbi/porges-reports": "Porges Reports",
  "/powerbi/BBM-reports": "BAUSCH & LOMB Reports",
  "/powerbi/coloplast-reports": "Coloplast Reports",
  "/powerbi/genadyne-reports": "Genadyne Reports",
  "/powerbi/amoena-reports": "AMOENA Reports",
  "/powerbi/abbott-reports": "ABBOTT Reports",
};

function titleCaseSegment(segment: string) {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getBackRoute(pathname: string): BackRoute | null {
  if (!pathname || pathname === "/") return null;

  const exact = EXACT_BACK_ROUTES[pathname];
  if (exact) return exact;

  for (const entry of PATTERN_BACK_ROUTES) {
    if (entry.pattern.test(pathname)) return entry.route;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) {
    return { href: "/", label: "Αρχική" };
  }

  const parentPath = `/${segments.slice(0, -1).join("/")}`;
  const label =
    PARENT_LABELS[parentPath] ??
    titleCaseSegment(segments[segments.length - 2] ?? "Πίσω");

  return { href: parentPath, label };
}
