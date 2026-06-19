import { BbmSalesReportPage } from "@/features/powerBI/BbmSalesReportPage";

export default function Page() {
  return (
    <BbmSalesReportPage apiPath="/api/powerbi/bbm-sales-2025" year={2025} />
  );
}
