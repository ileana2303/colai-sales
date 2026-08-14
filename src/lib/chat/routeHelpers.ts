import "server-only";

import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { ChatUpstreamError } from "@/lib/chat/upstream";
import { NextResponse } from "next/server";

export async function requireChatRouteAuth() {
  const auth = await getPowerBiRouteAuthContext();
  if (!auth.ok) {
    return { ok: false as const, response: auth.response };
  }
  return {
    ok: true as const,
    area: auth.reportContext.area,
    token: auth.token,
  };
}

export function chatErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ChatUpstreamError) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: error.status },
    );
  }
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ ok: false, message }, { status: 502 });
}

export function requireAreaParam(
  request: Request,
  sessionArea: string,
): string | NextResponse {
  const url = new URL(request.url);
  const requested = url.searchParams.get("area")?.trim();
  if (!requested) return sessionArea;
  if (requested !== sessionArea) {
    return NextResponse.json(
      { ok: false, message: "Conversation not found" },
      { status: 404 },
    );
  }
  return requested;
}
