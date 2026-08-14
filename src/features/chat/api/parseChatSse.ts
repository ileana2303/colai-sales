import type {
  ChatSseEvent,
  ChatStreamHandlers,
} from "@/features/chat/api/parseChatSse.types";

function parseEventBlock(block: string): ChatSseEvent | null {
  const lines = block.split(/\r?\n/);
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(dataLines.join("\n"));
  } catch {
    return null;
  }

  if (typeof payload !== "object" || payload === null) return null;

  if (eventName === "token") {
    const text = (payload as { text?: unknown }).text;
    return typeof text === "string" ? { event: "token", text } : null;
  }

  if (eventName === "tool_call") {
    const value = payload as {
      index?: unknown;
      id?: unknown;
      name?: unknown;
      args?: unknown;
    };
    return {
      event: "tool_call",
      index: typeof value.index === "number" ? value.index : 0,
      id: typeof value.id === "string" ? value.id : null,
      name: typeof value.name === "string" ? value.name : null,
      args: typeof value.args === "string" ? value.args : "",
    };
  }

  if (eventName === "tool_result") {
    const value = payload as {
      name?: unknown;
      tool_call_id?: unknown;
      content?: unknown;
    };
    if (typeof value.name !== "string") return null;
    if (typeof value.tool_call_id !== "string") return null;
    if (typeof value.content !== "string") return null;
    return {
      event: "tool_result",
      name: value.name,
      tool_call_id: value.tool_call_id,
      content: value.content,
    };
  }

  if (eventName === "done") {
    const conversationId = (payload as { conversation_id?: unknown })
      .conversation_id;
    return typeof conversationId === "string"
      ? { event: "done", conversation_id: conversationId }
      : null;
  }

  if (eventName === "error") {
    const detail = (payload as { detail?: unknown }).detail;
    return {
      event: "error",
      detail:
        typeof detail === "string" && detail.trim()
          ? detail.trim()
          : "The assistant failed to answer. Please try again.",
    };
  }

  return null;
}

export async function readChatSseStream(
  response: Response,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<string> {
  if (!response.body) {
    throw new Error("Chat stream is empty.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let sawDone = false;
  let streamError: string | null = null;

  const consumeBlock = (block: string) => {
    const parsed = parseEventBlock(block);
    if (!parsed) return;

    if (parsed.event === "token") {
      fullText += parsed.text;
      handlers.onToken(parsed.text, fullText);
      return;
    }
    if (parsed.event === "tool_call") {
      handlers.onToolCall?.(parsed);
      return;
    }
    if (parsed.event === "tool_result") {
      handlers.onToolResult?.(parsed);
      return;
    }
    if (parsed.event === "done") {
      sawDone = true;
      handlers.onDone?.(parsed.conversation_id);
      return;
    }
    if (parsed.event === "error") {
      streamError = parsed.detail;
    }
  };

  while (true) {
    if (signal?.aborted) {
      await reader.cancel().catch(() => undefined);
      throw new DOMException("Aborted", "AbortError");
    }

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      if (part.trim()) consumeBlock(part);
      if (streamError) break;
    }
    if (streamError) break;
  }

  if (buffer.trim()) {
    consumeBlock(buffer);
  }

  if (streamError) {
    throw new Error(streamError);
  }
  if (!sawDone) {
    throw new Error("The assistant failed to answer. Please try again.");
  }

  return fullText;
}
