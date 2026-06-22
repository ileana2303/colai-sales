import { TargetsTrendsReportPage } from "@/features/powerBI/TargetsTrendsReportPage";

export default function Page() {
  return (
    <TargetsTrendsReportPage
      businessUnit="porges"
      group1Label="PORGES Group"
      group2Label="PORGES SUB"
      groupSectionTitle="Ανά PORGES group / SUB"
      subtitle="2026 + 2025 + Trend analysis"
      title="Porges Targets & Trends"
    />
  );
}
