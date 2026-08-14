import { NextResponse } from "next/server";

import { chatErrorResponse, requireChatRouteAuth } from "@/lib/chat/routeHelpers";
import { fetchChatModels } from "@/lib/chat/upstream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireChatRouteAuth();
  if (!auth.ok) return auth.response;

  try {
    const data = await fetchChatModels();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return chatErrorResponse(error, "Failed to load chat models.");
  }
}
