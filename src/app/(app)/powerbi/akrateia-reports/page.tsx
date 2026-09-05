import { getAreaMatrixPageProps } from "@/features/powerBI/areaMatrixPages";
import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";

export default function Page() {
  return <PowerBiReportMatrixPage {...getAreaMatrixPageProps("akrateia")} />;
}
