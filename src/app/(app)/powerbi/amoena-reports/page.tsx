import { getAmoenaTabbedMatrixPageProps } from "@/features/powerBI/areaMatrixPages";
import { PowerBiTabbedReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";

export default function Page() {
  return (
    <PowerBiTabbedReportMatrixPage {...getAmoenaTabbedMatrixPageProps()} />
  );
}
