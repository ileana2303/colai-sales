import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import { isAreaPickerUser } from "@/lib/managerPickerAccess";
import {
  decodeSelectedSellerCookie,
  selectedSellerCookieName,
} from "@/lib/selectedSellerContext";
import {
  fetchPowerBiSellersCatalog,
  findPowerBiSellerByCode,
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

function readSelectedSellerContext(
  userInfo: SessionUserInfo | null,
  cookieValue?: string,
) {
  if (!isAreaPickerUser(userInfo)) return null;
  return decodeSelectedSellerCookie(cookieValue);
}

export async function getPowerBiRouteAuthContext(): Promise<PowerBiRouteAuthResult> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const userInfo = decodeUserInfoCookie(jar.get(userCookieName)?.value);
  const selectedContext = readSelectedSellerContext(
    userInfo,
    jar.get(selectedSellerCookieName)?.value,
  );
  const reportContext = await resolveReportSellerContext(
    userInfo,
    { amsaAccessToken: token },
    selectedContext,
  );

  if (!reportContext?.area) {
    return {
      ok: false,
      response: badRequestResponse(
        isAreaPickerUser(userInfo)
          ? "Select an area before viewing area reports"
          : "Missing area or sellers for authenticated user",
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

export async function getPowerBiSellersRouteContext(options?: {
  scope?: "all" | "selected";
}): Promise<
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

  if (isAreaPickerUser(userInfo)) {
    if (options?.scope === "all") {
      return {
        ok: true,
        token,
        userInfo,
        area: "",
        records: allRecords,
        matched: null,
      };
    }

    const selectedContext = readSelectedSellerContext(
      userInfo,
      jar.get(selectedSellerCookieName)?.value,
    );

    if (!selectedContext) {
      return {
        ok: true,
        token,
        userInfo,
        area: "",
        records: [],
        matched: null,
      };
    }

    const area = selectedContext.area.trim();
    const records = findPowerBiSellersByArea(allRecords, area);
    const matched =
      findPowerBiSellerByCode(allRecords, selectedContext.sellerCode) ?? null;

    return {
      ok: true,
      token,
      userInfo,
      area,
      records,
      matched,
    };
  }

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
