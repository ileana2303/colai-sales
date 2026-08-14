import "server-only";

import { chatApiUrl, getChatApiKey } from "@/lib/chat/config";
import type {
  ChatConversation,
  ChatConversationsList,
  ChatMessagesList,
  ChatModelsResponse,
  ChatQueriesList,
  CreateChatConversationInput,
  StreamChatMessageInput,
} from "@/lib/chat/types";
import { getApiErrorMessage } from "@/lib/api/client";

export class ChatUpstreamError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatUpstreamError";
    this.status = status;
  }
}

function requireChatApiKey(): string {
  const apiKey = getChatApiKey();
  if (!apiKey) {
    throw new ChatUpstreamError(
      "Chat is not configured (CHAT_API_KEY is missing).",
      503,
    );
  }
  return apiKey;
}

function authHeaders(apiKey: string, contentType?: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function withAreaQuery(path: string, area: string, extra?: Record<string, string | number | undefined>) {
  const url = new URL(chatApiUrl(path));
  url.searchParams.set("area", area);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value == null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function readUpstreamError(response: Response, fallback: string) {
  const payload: unknown = await response.json().catch(() => ({}));
  return getApiErrorMessage(payload, fallback);
}

async function chatFetch<T>(
  url: string,
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) {
    throw new ChatUpstreamError(
      await readUpstreamError(response, fallbackError),
      response.status,
    );
  }
  return (await response.json()) as T;
}

export async function fetchChatModels(): Promise<ChatModelsResponse> {
  const apiKey = requireChatApiKey();
  return chatFetch(
    chatApiUrl("/chat/models"),
    { headers: authHeaders(apiKey) },
    "Failed to load chat models.",
  );
}

export async function createChatConversation(
  input: CreateChatConversationInput,
): Promise<ChatConversation> {
  const apiKey = requireChatApiKey();
  return chatFetch(
    chatApiUrl("/chat/conversations"),
    {
      method: "POST",
      headers: authHeaders(apiKey, "application/json"),
      body: JSON.stringify({
        area: input.area,
        page_code: input.page_code ?? undefined,
        title: input.title ?? undefined,
      }),
    },
    "Failed to create conversation.",
  );
}

export async function listChatConversations(options: {
  area: string;
  pageCode?: string | null;
  skip?: number;
  limit?: number;
}): Promise<ChatConversationsList> {
  const apiKey = requireChatApiKey();
  return chatFetch(
    withAreaQuery("/chat/conversations", options.area, {
      page_code: options.pageCode ?? undefined,
      skip: options.skip,
      limit: options.limit,
    }),
    { headers: authHeaders(apiKey) },
    "Failed to list conversations.",
  );
}

export async function getChatMessages(options: {
  conversationId: string;
  area: string;
}): Promise<ChatMessagesList> {
  const apiKey = requireChatApiKey();
  return chatFetch(
    withAreaQuery(
      `/chat/conversations/${options.conversationId}/messages`,
      options.area,
    ),
    { headers: authHeaders(apiKey) },
    "Failed to load messages.",
  );
}

export async function getChatQueries(options: {
  conversationId: string;
  area: string;
}): Promise<ChatQueriesList> {
  const apiKey = requireChatApiKey();
  return chatFetch(
    withAreaQuery(
      `/chat/conversations/${options.conversationId}/queries`,
      options.area,
    ),
    { headers: authHeaders(apiKey) },
    "Failed to load queries.",
  );
}

export async function deleteChatConversation(options: {
  conversationId: string;
  area: string;
}): Promise<{ message: string }> {
  const apiKey = requireChatApiKey();
  return chatFetch(
    withAreaQuery(
      `/chat/conversations/${options.conversationId}`,
      options.area,
    ),
    {
      method: "DELETE",
      headers: authHeaders(apiKey),
    },
    "Failed to delete conversation.",
  );
}

export async function streamChatConversation(options: {
  conversationId: string;
  area: string;
  body: StreamChatMessageInput;
  signal?: AbortSignal;
}): Promise<Response> {
  const apiKey = requireChatApiKey();
  const response = await fetch(
    withAreaQuery(
      `/chat/conversations/${options.conversationId}/stream`,
      options.area,
    ),
    {
      method: "POST",
      headers: {
        ...authHeaders(apiKey, "application/json"),
        Accept: "text/event-stream",
      },
      body: JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    },
  );

  if (!response.ok || !response.body) {
    throw new ChatUpstreamError(
      await readUpstreamError(response, "Failed to stream chat reply."),
      response.status >= 400 ? response.status : 502,
    );
  }

  return response;
}
