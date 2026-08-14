import "server-only";

const DEFAULT_BASE_URL = "https://powerclaude.loworbit.online/api/v1";

export function getChatApiKey(): string | null {
  const key = process.env.CHAT_API_KEY?.trim();
  return key || null;
}

export function getChatApiBaseUrl(): string {
  const fromEnv = process.env.CHAT_API_BASE_URL?.trim();
  if (!fromEnv) return DEFAULT_BASE_URL;
  return fromEnv.replace(/\/+$/, "");
}

export function chatApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getChatApiBaseUrl()}${normalized}`;
}
