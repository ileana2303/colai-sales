import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import {
  fetchPowerBiSellersCatalog,
  findPowerBiSellersByArea,
  type PowerBiSellerRow,
  resolveReportSellerContext,
  type ResolvedReportSellerContext,
} from "@/lib/bi-reports/sellers";
import { POWERBI_NO_CACHE_HEADERS } from "@/lib/bi-reports/powerBi";
import type { ApiUserInfo } from "@/types/api/schemas";
import type { SessionUserInfo } from "@/lib/sessionUser";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type PowerBiRouteAuthSuccess = {
  ok: true;
  token: string;
  userInfo: ApiUserInfo | null;
  reportContext: ResolvedReportSellerContext;
};

type PowerBiRouteAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type PowerBiRouteAuthResult =
  | PowerBiRouteAuthSuccess
  | PowerBiRouteAuthFailure;

function unauthorizedResponse(message = "Not authenticated") {
  return NextResponse.json(
    { ok: false, message },
    { status: 401, headers: POWERBI_NO_CACHE_HEADERS },
  );
}

function badRequestResponse(message: string) {
  return NextResponse.json(
    { ok: false, message },
    { status: 400, headers: POWERBI_NO_CACHE_HEADERS },
  );
}

export async function getPowerBiRouteAuthContext(): Promise<PowerBiRouteAuthResult> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const userInfo = decodeUserInfoCookie(jar.get(userCookieName)?.value);
  const reportContext = await resolveReportSellerContext(userInfo, {
    amsaAccessToken: token,
  });

  if (!reportContext?.area) {
    return {
      ok: false,
      response: badRequestResponse(
        "Missing area or sellers for authenticated user",
      ),
    };
  }

  return {
    ok: true,
    token,
    userInfo,
    reportContext,
  };
}

export async function getPowerBiSellersRouteContext(): Promise<
  | {
      ok: true;
      token: string;
      userInfo: ApiUserInfo | null;
      area: string;
      records: PowerBiSellerRow[];
      matched: PowerBiSellerRow | null;
    }
  | PowerBiRouteAuthFailure
> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const userInfo = decodeUserInfoCookie(jar.get(userCookieName)?.value);
  const tokenOptions = { amsaAccessToken: token };
  const allRecords = await fetchPowerBiSellersCatalog(tokenOptions);
  const area = userInfo?.area?.trim() ?? "";
  const records = area
    ? findPowerBiSellersByArea(allRecords, area)
    : allRecords;

  return {
    ok: true,
    token,
    userInfo,
    area,
    records,
    matched: null,
  };
}
