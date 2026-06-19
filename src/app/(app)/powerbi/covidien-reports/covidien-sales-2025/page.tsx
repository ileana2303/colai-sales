import { CovidienSalesReportPage } from "@/features/powerBI/CovidienSalesReportPage";

export default function Page() {
  return (
    <CovidienSalesReportPage
      apiPath="/api/powerbi/covidien-sales-2025"
      year={2025}
    />
  );
}
