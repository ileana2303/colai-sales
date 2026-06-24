import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import {
  fetchPowerBiSellersCatalog,
  findPowerBiSellerByCode,
  type PowerBiSellerRow,
  resolveReportSellerContext,
  type ResolvedReportSellerContext,
} from "@/lib/bi-reports/sellers";
import { POWERBI_NO_CACHE_HEADERS } from "@/lib/bi-reports/powerBi";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import type { ApiUserInfo } from "@/types/api/schemas";
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
        "Missing Power BI seller mapping for authenticated user",
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
  const records = await fetchPowerBiSellersCatalog(tokenOptions);
  const sellerCode = normalizeSellerCode(userInfo?.sellerCode);
  const matched = sellerCode
    ? findPowerBiSellerByCode(records, sellerCode)
    : null;

  return {
    ok: true,
    token,
    userInfo,
    records,
    matched,
  };
}
