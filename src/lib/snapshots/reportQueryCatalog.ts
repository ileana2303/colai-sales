import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase";
import { normalizeReportQueryType } from "@/lib/snapshots/queryGrouping";
import type { ReportQuery, StoredReportQuery } from "@/lib/snapshots/types";

export async function listReportQueries() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("report_queries")
    .select("*")
    .eq("is_active", true)
    .order("page_code")
    .order("report_code");

  if (error) throw new Error(`Failed to load report queries: ${error.message}`);

  const queries = ((data ?? []) as StoredReportQuery[]).map((query) => {
    const reportType = normalizeReportQueryType(
      query.report_type,
      query.report_code,
    );
    if (!reportType) {
      throw new Error(
        `Unsupported report_type "${query.report_type}" for ${query.report_code}.`,
      );
    }

    return { ...query, report_type: reportType } satisfies ReportQuery;
  });

  return { queries };
}
