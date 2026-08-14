import { NextResponse } from "next/server";

import {
  chatErrorResponse,
  requireAreaParam,
  requireChatRouteAuth,
} from "@/lib/chat/routeHelpers";
import {
  createChatConversation,
  listChatConversations,
} from "@/lib/chat/upstream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireChatRouteAuth();
  if (!auth.ok) return auth.response;

  const areaOrError = requireAreaParam(request, auth.area);
  if (areaOrError instanceof NextResponse) return areaOrError;

  const url = new URL(request.url);
  const pageCode = url.searchParams.get("page_code");
  const skip = Number(url.searchParams.get("skip") ?? "0");
  const limit = Number(url.searchParams.get("limit") ?? "50");

  try {
    const data = await listChatConversations({
      area: areaOrError,
      pageCode,
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 50,
    });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return chatErrorResponse(error, "Failed to list conversations.");
  }
}

export async function POST(request: Request) {
  const auth = await requireChatRouteAuth();
  if (!auth.ok) return auth.response;

  let body: { page_code?: string | null; title?: string | null } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const conversation = await createChatConversation({
      area: auth.area,
      page_code: body.page_code,
      title: body.title,
    });
    return NextResponse.json({ ok: true, conversation });
  } catch (error) {
    return chatErrorResponse(error, "Failed to create conversation.");
  }
}
