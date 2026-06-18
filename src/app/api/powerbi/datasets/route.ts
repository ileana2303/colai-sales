import { cookieName } from "@/lib/auth";
import {
  getDefaultPowerBiWorkspaceId,
  getPowerBiDatasets,
  POWERBI_NO_CACHE_HEADERS,
  PowerBiRequestError,
} from "@/lib/bi-reports/powerBi";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  const workspaceId = getDefaultPowerBiWorkspaceId();

  try {
    const datasets = await getPowerBiDatasets(
      { workspaceId },
      { amsaAccessToken: token },
    );

    return NextResponse.json(
      {
        ok: true,
        workspaceId,
        datasets,
      },
      { headers: POWERBI_NO_CACHE_HEADERS },
    );
  } catch (err) {
    const status = err instanceof PowerBiRequestError ? err.status : 500;
    const message =
      err instanceof Error ? err.message : "Power BI datasets request failed";

    return NextResponse.json(
      { ok: false, message, workspaceId },
      { status, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }
}
