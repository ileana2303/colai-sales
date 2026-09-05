import { NextResponse } from "next/server";

import {
  chatErrorResponse,
  requireAreaParam,
  requireChatRouteAuth,
} from "@/lib/chat/routeHelpers";
import { deleteChatConversation } from "@/lib/chat/upstream";
import type { ChatConversationRouteContext } from "@/lib/chat/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: ChatConversationRouteContext,
) {
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
