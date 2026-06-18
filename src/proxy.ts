// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookieName } from "./lib/auth"; // if your file is in src/lib/auth.ts use "./src/lib/auth"

const PUBLIC_PATHS = [
  "/login",
  "/privacy-policy",
  "/terms-of-use",
  "/api/auth/login",
  "/api/auth/logout",
];
const PUBLIC_FILE = /\.(.*)$/;

function isAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE.test(pathname)
  );
}

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isAsset(pathname)) return NextResponse.next();

  const token = req.cookies.get(cookieName)?.value;
  const isLoggedIn = Boolean(token);

  // Not logged in -> block everything except public
  if (!isLoggedIn && !isPublic(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Logged in -> block /login
  if (isLoggedIn && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Optional: protect API with 401 instead of redirect
  if (!isLoggedIn && pathname.startsWith("/api") && !isPublic(pathname)) {
    return NextResponse.json(
      { ok: false, message: "unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
