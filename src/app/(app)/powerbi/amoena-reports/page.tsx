import { ReportMatrixTable } from "@/features/powerBI/ReportMatrixTable";
import {
  buildReportMatrixRows,
  createReportMatrixSections,
  reportMatrixLeadingColumns,
  type PowerBiMatrixSourceRow,
} from "@/features/powerBI/reportMatrixData";

const CURRENT_YEAR = 2026;
const PREVIOUS_YEAR = 2025;

export default function Page() {
  return (
    <div className="app-page">
      <ReportMatrixTable
        brandLabel="AMOENA"
        caption="AMOENA report target matrix"
        exportFileName="amoena-matrix"
        leadingColumns={reportMatrixLeadingColumns}
        rows={amoenaRows}
        sections={amoenaSections}
      />
    </div>
  );
}

const amoenaSeedRows: PowerBiMatrixSourceRow[] = [
  {
    group2: "AMOENA",
    group1: "ΤΖΙΡΟΣ ΧΟΝΔΡΙΚΗΣ",
    team: "AMOENA",
    sellerName: "Seeded template",
    sellerCode: "-",
    tcy: 178000,
    vcy: 79000,
    vlc: 72000,
    vTrend: 186500,
  },
  {
    group2: "AMOENA",
    group1: "ΝΟΣΟΚΟΜΕΙΑΚΟΣ",
    team: "AMOENA",
    sellerName: "Seeded template",
    sellerCode: "-",
    tcy: 126000,
    vcy: 56500,
    vlc: 51700,
    vTrend: 119500,
  },
  {
    group2: "AMOENA",
    group1: "ΤΖΙΡΟΣ ΛΙΑΝΙΚΗΣ",
    team: "AMOENA",
    sellerName: "Seeded template",
    sellerCode: "-",
    tcy: 108000,
    vcy: 43200,
    vlc: 39800,
    vTrend: 111600,
  },
  {
    group2: "AMOENA",
    group1: "ΤΖΙΡΟΣ ΝΕΩΝ",
    team: "AMOENA",
    sellerName: "Seeded template",
    sellerCode: "-",
    tcy: 74000,
    vcy: 38700,
    vlc: 35200,
    vTrend: 76500,
  },
  {
    group2: "AMOENA",
    group1: "ΝΕΑ ΠΕΡΙΣΤΑΤΙΚΑ",
    team: "AMOENA",
    sellerName: "Seeded template",
    sellerCode: "-",
    tcy: 132000,
    vcy: 58900,
    vlc: 55200,
    vTrend: 124200,
  },
  {
    group2: "AMOENA",
    group1: "Μ.Ο. ΝΕΩΝ",
    team: "AMOENA",
    sellerName: "Seeded template",
    sellerCode: "-",
    tcy: 68500,
    vcy: 31200,
    vlc: 27800,
    vTrend: 70400,
  },
];

const amoenaSections = createReportMatrixSections({
  currentYear: CURRENT_YEAR,
  previousYear: PREVIOUS_YEAR,
});

const amoenaRows = buildReportMatrixRows({
  currentRows: amoenaSeedRows,
  previousRows: amoenaSeedRows,
  trendRows: amoenaSeedRows,
});
