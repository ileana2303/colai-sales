import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  cookieName,
  decodeUserInfoCookie,
  userCookieName,
} from "@/lib/auth";
import {
  fetchPowerBiSellersCatalog,
  findPowerBiSellersByArea,
} from "@/lib/bi-reports/sellers";
import { isAreaPickerUser } from "@/lib/managerPickerAccess";
import {
  encodeSelectedSellerCookie,
  selectedSellerCookieName,
  type SelectedSellerContext,
} from "@/lib/selectedSellerContext";
import { getObject } from "@/lib/utils/json";
import { normalizeSellerCode } from "@/lib/sellerAccess";

const SELECTED_SELLER_MAX_AGE_SECONDS = 60 * 60 * 12;

function unauthorized() {
  return NextResponse.json(
    { ok: false, message: "Not authenticated" },
    { status: 401 },
  );
}

function forbidden() {
  return NextResponse.json(
    { ok: false, message: "Seller selection is not allowed for this user" },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return unauthorized();

  const userInfo = decodeUserInfoCookie(jar.get(userCookieName)?.value);
  if (!isAreaPickerUser(userInfo)) return forbidden();

  const body = getObject(await request.json().catch(() => null));
  const area = String(body?.area ?? "").trim();
  if (!area) {
    return NextResponse.json(
      { ok: false, message: "Missing area" },
      { status: 400 },
    );
  }

  const records = await fetchPowerBiSellersCatalog({ amsaAccessToken: token });
  const areaSellers = findPowerBiSellersByArea(records, area);
  if (!areaSellers.length) {
    return NextResponse.json(
      { ok: false, message: "Area not found" },
      { status: 404 },
    );
  }

  const representative = areaSellers[0];
  const selectedSeller: SelectedSellerContext = {
    area: representative.area,
    sellerCode: normalizeSellerCode(representative.sellerCode) ?? "",
    salesPerson: representative.salesPerson,
    team: representative.team,
  };

  jar.set(selectedSellerCookieName, encodeSelectedSellerCookie(selectedSeller), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SELECTED_SELLER_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true, selectedSeller });
}

export async function DELETE() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return unauthorized();

  const userInfo = decodeUserInfoCookie(jar.get(userCookieName)?.value);
  if (!isAreaPickerUser(userInfo)) return forbidden();

  jar.set(selectedSellerCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
