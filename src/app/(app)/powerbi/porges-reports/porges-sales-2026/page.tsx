import { PorgesSalesReportPage } from "@/features/powerBI/PorgesSalesReportPage";

export default function Page() {
  return (
    <PorgesSalesReportPage
      apiPath="/api/powerbi/porges-sales-2026"
      showAllDataTable
      year={2026}
    />
  );
}
