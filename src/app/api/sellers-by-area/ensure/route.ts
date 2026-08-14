import { NextResponse } from "next/server";

import { cookieName } from "@/lib/auth";
import {
  POWERBI_NO_CACHE_HEADERS,
  PowerBiRequestError,
} from "@/lib/bi-reports/powerBi";
import { ensureSellersByArea } from "@/lib/sellersByArea/ensure";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const jar = await cookies();
    const token = jar.get(cookieName)?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Not authenticated" },
        { status: 401, headers: POWERBI_NO_CACHE_HEADERS },
      );
    }

    const result = await ensureSellersByArea({ amsaAccessToken: token });

    return NextResponse.json(
      { ok: true, ...result },
      { headers: POWERBI_NO_CACHE_HEADERS },
    );
  } catch (err) {
    const status = err instanceof PowerBiRequestError ? err.status : 500;
    const message =
      err instanceof Error
        ? err.message
        : "Failed to ensure area_sellers catalog";

    return NextResponse.json(
      { ok: false, message },
      { status, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }
}
