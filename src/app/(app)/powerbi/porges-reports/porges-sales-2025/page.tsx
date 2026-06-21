import { PorgesSalesReportPage } from "@/features/powerBI/PorgesSalesReportPage";

export default function Page() {
  return (
    <PorgesSalesReportPage
      apiPath="/api/powerbi/porges-sales-2025"
      year={2025}
    />
  );
}
