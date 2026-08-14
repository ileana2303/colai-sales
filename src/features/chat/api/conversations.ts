import { getApiErrorMessage, parseProxyJson } from "@/lib/api/client";
import type {
  ChatConversation,
  ChatConversationsList,
  ChatMessagesList,
  ChatQueriesList,
} from "@/lib/chat/types";

function withArea(path: string, area: string, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams({ area });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (!value) continue;
      params.set(key, value);
    }
  }
  return `${path}?${params.toString()}`;
}

export async function createConversationRequest(input: {
  area: string;
  pageCode?: string | null;
  title?: string | null;
}): Promise<ChatConversation> {
  const res = await fetch("/api/chat/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page_code: input.pageCode ?? undefined,
      title: input.title ?? undefined,
    }),
  });
  const data = await parseProxyJson<{ ok: true; conversation: ChatConversation }>(
    res,
    "Failed to create conversation.",
  );
  return data.conversation;
}

export async function listConversationsRequest(input: {
  area: string;
  pageCode?: string | null;
  limit?: number;
}): Promise<ChatConversationsList> {
  const res = await fetch(
    withArea("/api/chat/conversations", input.area, {
      page_code: input.pageCode ?? undefined,
      limit: input.limit != null ? String(input.limit) : undefined,
    }),
    { cache: "no-store" },
  );
  return parseProxyJson<ChatConversationsList & { ok: true }>(
    res,
    "Failed to list conversations.",
  );
}

export async function getConversationMessagesRequest(input: {
  conversationId: string;
  area: string;
}): Promise<ChatMessagesList> {
  const res = await fetch(
    withArea(
      `/api/chat/conversations/${input.conversationId}/messages`,
      input.area,
    ),
    { cache: "no-store" },
  );
  return parseProxyJson<ChatMessagesList & { ok: true }>(
    res,
    "Failed to load messages.",
  );
}

export async function getConversationQueriesRequest(input: {
  conversationId: string;
  area: string;
}): Promise<ChatQueriesList> {
  const res = await fetch(
    withArea(
      `/api/chat/conversations/${input.conversationId}/queries`,
      input.area,
    ),
    { cache: "no-store" },
  );
  return parseProxyJson<ChatQueriesList & { ok: true }>(
    res,
    "Failed to load queries.",
  );
}

export async function deleteConversationRequest(input: {
  conversationId: string;
  area: string;
}): Promise<void> {
  const res = await fetch(
    withArea(`/api/chat/conversations/${input.conversationId}`, input.area),
    { method: "DELETE" },
  );
  await parseProxyJson(res, "Failed to delete conversation.");
}

export async function openConversationStream(input: {
  conversationId: string;
  area: string;
  content: string;
  model?: string;
  signal?: AbortSignal;
}): Promise<Response> {
  const res = await fetch(
    withArea(
      `/api/chat/conversations/${input.conversationId}/stream`,
      input.area,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: input.content,
        model: input.model,
      }),
      signal: input.signal,
    },
  );

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("text/event-stream")) {
    const payload: unknown = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(payload, "Chat stream failed."));
  }

  return res;
}
