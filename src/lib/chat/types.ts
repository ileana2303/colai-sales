export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatConversation = {
  id: string;
  area: string | null;
  page_code: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatConversationsList = {
  data: ChatConversation[];
  count: number;
};

export type ChatMessagesList = {
  data: ChatMessage[];
  count: number;
};

export type ChatToolQuery = {
  name: string;
  args: string;
  result: string | null;
  created_at: string;
};

export type ChatQueriesList = {
  data: ChatToolQuery[];
  count: number;
};

export type ChatModelsResponse = {
  data: string[];
  default: string;
};

export type CreateChatConversationInput = {
  area: string;
  page_code?: string | null;
  title?: string | null;
};

export type StreamChatMessageInput = {
  content: string;
  model?: string;
};

export type ChatConversationRouteContext = {
  params: Promise<{ id: string }>;
};
