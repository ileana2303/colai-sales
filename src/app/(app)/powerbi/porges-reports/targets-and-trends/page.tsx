import { TargetsTrendsReportPage } from "@/features/powerBI/TargetsTrendsReportPage";

export default function Page() {
  return (
    <TargetsTrendsReportPage
      businessUnit="porges"
      group1Label="PORGES Group"
      groupSectionTitle="Ανά PORGES group"
      subtitle="2026 + 2025 + Trend analysis"
      title="Porges Targets & Trends"
    />
  );
}
