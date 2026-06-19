import { BbmSalesReportPage } from "@/features/powerBI/BbmSalesReportPage";

export default function Page() {
  return (
    <BbmSalesReportPage apiPath="/api/powerbi/bbm-sales-2026" year={2026} />
  );
}
