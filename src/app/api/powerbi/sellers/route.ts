import { getPowerBiSellersRouteContext } from "@/lib/bi-reports/powerBiRouteContext";
import {
  POWERBI_NO_CACHE_HEADERS,
  PowerBiRequestError,
} from "@/lib/bi-reports/powerBi";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") === "all" ? "all" : "selected";
    const context = await getPowerBiSellersRouteContext({ scope });
    if (!context.ok) {
      return context.response;
    }

    return NextResponse.json(
      {
        ok: true,
        report: "sellers",
        area: context.area,
        matched: context.matched,
        records: context.records,
      },
      { headers: POWERBI_NO_CACHE_HEADERS },
    );
  } catch (err) {
    const status = err instanceof PowerBiRequestError ? err.status : 500;
    const message =
      err instanceof Error ? err.message : "Power BI request failed";

    return NextResponse.json(
      { ok: false, message },
      { status, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }
}
