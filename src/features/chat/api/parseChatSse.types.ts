export type ChatSseEvent =
  | { event: "token"; text: string }
  | { event: "tool_call"; index: number; id: string | null; name: string | null; args: string }
  | { event: "tool_result"; name: string; tool_call_id: string; content: string }
  | { event: "done"; conversation_id: string }
  | { event: "error"; detail: string };

export type ChatStreamHandlers = {
  onToken: (text: string, fullText: string) => void;
  onToolCall?: (payload: Extract<ChatSseEvent, { event: "tool_call" }>) => void;
  onToolResult?: (payload: Extract<ChatSseEvent, { event: "tool_result" }>) => void;
  onDone?: (conversationId: string) => void;
};
