import { NextResponse } from "next/server";

import {
  chatErrorResponse,
  requireAreaParam,
  requireChatRouteAuth,
} from "@/lib/chat/routeHelpers";
import { getChatQueries } from "@/lib/chat/upstream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireChatRouteAuth();
  if (!auth.ok) return auth.response;

  const areaOrError = requireAreaParam(request, auth.area);
  if (areaOrError instanceof NextResponse) return areaOrError;

  const { id } = await context.params;

  try {
    const data = await getChatQueries({
      conversationId: id,
      area: areaOrError,
    });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return chatErrorResponse(error, "Failed to load queries.");
  }
}
