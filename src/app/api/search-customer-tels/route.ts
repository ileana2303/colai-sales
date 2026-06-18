import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token)
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401 },
    );

  const url = new URL(req.url);
  const customer_GID = url.searchParams.get("customer_GID")?.trim() ?? "";
  const customerAMKA = url.searchParams.get("customerAMKA")?.trim() ?? "";

  if (!customer_GID && !customerAMKA) {
    return NextResponse.json(
      { ok: false, message: "customer_GID or customerAMKA required" },
      { status: 400 },
    );
  }

  const upstream = new URL(
    `${process.env.AMSA_API_BASE_URL}/api/search-customer-tels`,
  );
  if (customer_GID) upstream.searchParams.set("customer_GID", customer_GID);
  if (customerAMKA) upstream.searchParams.set("customerAMKA", customerAMKA);

  const res = await fetch(upstream.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return NextResponse.json(
      { ok: false, message: t || "Backend fetch failed" },
      { status: res.status },
    );
  }

  const payload = await res
    .json()
    .catch((e: unknown) => ({ message: String(e) }));

  return NextResponse.json(
    { ok: true, ...payload },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );
}
