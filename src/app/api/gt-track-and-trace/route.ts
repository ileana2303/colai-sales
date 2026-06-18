import { cookieName } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

export async function GET(req: Request) {
  const voucher = new URL(req.url).searchParams.get("voucher")?.trim();
  if (!voucher) {
    return NextResponse.json(
      { ok: false, message: "Missing voucher" },
      { status: 400, headers: noCacheHeaders },
    );
  }

  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401, headers: noCacheHeaders },
    );
  }

  const baseUrl = process.env.AMSA_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, message: "Missing AMSA_API_BASE_URL" },
      { status: 500, headers: noCacheHeaders },
    );
  }

  const backendUrl = `${baseUrl}/api/gt-track-and-trace?${new URLSearchParams({
    voucher,
  }).toString()}`;

  let res: Response;
  try {
    res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Track and trace request failed";
    return NextResponse.json(
      { ok: false, message },
      { status: 502, headers: noCacheHeaders },
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { ok: false, message: text || "Track and trace fetch failed" },
      { status: res.status, headers: noCacheHeaders },
    );
  }

  const payload = await res.json().catch(() => ({}));

  return NextResponse.json(
    { ok: true, ...(typeof payload === "object" && payload ? payload : {}) },
    { headers: noCacheHeaders },
  );
}
