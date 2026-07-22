import {
  findPowerBiSellerByCode,
  type PowerBiSellerRow,
} from "@/lib/bi-reports/sellers";
import type { JoinedSnapshotSourceRow } from "@/lib/snapshots/types";

/** Fill Team / Seller Name from ASP_EBS_SELLERS when DAX omits them. */
export function enrichSnapshotRowsWithSellers(
  rows: JoinedSnapshotSourceRow[],
  sellersCatalog: PowerBiSellerRow[],
): JoinedSnapshotSourceRow[] {
  if (!sellersCatalog.length) return rows;

  return rows.map((row) => {
    const sellerCode = row.sellerCode?.trim();
    if (!sellerCode) return row;

    const match = findPowerBiSellerByCode(sellersCatalog, sellerCode);
    if (!match) return row;

    return {
      ...row,
      team: row.team || match.team || null,
      sellerName: row.sellerName || match.salesPerson || null,
    };
  });
}
