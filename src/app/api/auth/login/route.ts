import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { cookieName, userCookieName } from "@/lib/auth";
import type { LoginResp } from "@/types/api/schemas";
import type { LoginResponse } from "@/types/api/responses";

function base64urlEncode(obj: unknown) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}

export async function POST(req: Request) {
  const body = (await req.json()) as { username?: string; password?: string };

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (username.length < 2 || password.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Invalid credentials payload." },
      { status: 400 },
    );
  }

  const baseUrl = process.env.AMSA_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, message: "Missing AMSA_API_BASE_URL." },
      { status: 500 },
    );
  }

  const res = await axios.post(
    `${baseUrl}/api/login`,
    { username, password },
    { validateStatus: () => true },
  );

  const data = res.data as LoginResp;

  const backendStatusCode = Number(data?.statusCode);
  const token = data.accessToken;
  const expiresIn = data.expiresIn;

  if (Number.isFinite(backendStatusCode) && backendStatusCode !== 200) {
    return NextResponse.json(
      { ok: false, message: data?.message ?? "Login failed." },
      { status: 401 },
    );
  }

  if (!token) {
    return NextResponse.json(
      { ok: false, message: data?.message ?? "Login failed." },
      { status: 401 },
    );
  }

  // Cookie options
  const jar = cookies();
  (await jar).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // important for local dev
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn ?? undefined,
  });

  (await jar).set(userCookieName, base64urlEncode(data.userInfos), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn ?? undefined,
  });

  return NextResponse.json({ ok: true, ...data } satisfies LoginResponse);
}
