import { NextResponse } from "next/server";

import {
  chatErrorResponse,
  requireAreaParam,
  requireChatRouteAuth,
} from "@/lib/chat/routeHelpers";
import { deleteChatConversation } from "@/lib/chat/upstream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireChatRouteAuth();
  if (!auth.ok) return auth.response;

  const areaOrError = requireAreaParam(request, auth.area);
  if (areaOrError instanceof NextResponse) return areaOrError;

  const { id } = await context.params;

  try {
    const result = await deleteChatConversation({
      conversationId: id,
      area: areaOrError,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return chatErrorResponse(error, "Failed to delete conversation.");
  }
}
