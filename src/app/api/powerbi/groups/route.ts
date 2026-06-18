import { cookieName } from "@/lib/auth";
import {
  getDefaultPowerBiWorkspaceId,
  getPowerBiGroups,
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

  const configuredWorkspaceId = getDefaultPowerBiWorkspaceId();

  try {
    const groups = await getPowerBiGroups({ amsaAccessToken: token });
    const configuredGroup =
      groups.find((group) => group.id === configuredWorkspaceId) ?? null;

    return NextResponse.json(
      {
        ok: true,
        configuredWorkspaceId,
        configuredGroup,
        groups,
      },
      { headers: POWERBI_NO_CACHE_HEADERS },
    );
  } catch (err) {
    const status = err instanceof PowerBiRequestError ? err.status : 500;
    const message =
      err instanceof Error ? err.message : "Power BI groups request failed";

    return NextResponse.json(
      { ok: false, message, configuredWorkspaceId },
      { status, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }
}
