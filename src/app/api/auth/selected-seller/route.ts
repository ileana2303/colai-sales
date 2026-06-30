import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  cookieName,
  decodeUserInfoCookie,
  userCookieName,
} from "@/lib/auth";
import { isAreaPickerUser } from "@/lib/managerPickerAccess";
import {
  decodeSelectedSellerCookie,
  selectedSellerCookieName,
} from "@/lib/selectedSellerContext";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const userInfo = decodeUserInfoCookie(jar.get(userCookieName)?.value);
  const isPickerUser = isAreaPickerUser(userInfo);
  const selectedSeller = isPickerUser
    ? decodeSelectedSellerCookie(jar.get(selectedSellerCookieName)?.value)
    : null;

  return NextResponse.json({
    ok: true,
    isAreaPickerUser: isPickerUser,
    selectedSeller,
  });
}
