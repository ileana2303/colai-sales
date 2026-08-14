"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createConversationRequest,
  deleteConversationRequest,
  getConversationMessagesRequest,
  listConversationsRequest,
  openConversationStream,
} from "@/features/chat/api/conversations";
import { readChatSseStream } from "@/features/chat/api/parseChatSse";
import type { UseReportChatResult } from "@/features/chat/hooks/useReportChat.types";
import { createChatMessageId } from "@/features/chat/lib/format";
import type {
  ReportChatContext,
  ReportChatMessage,
} from "@/features/chat/types";
import type { ChatConversation } from "@/lib/chat/types";

export function useReportChat(context: ReportChatContext): UseReportChatResult {
  const [messages, setMessages] = useState<ReportChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const contextRef = useRef(context);
  const conversationIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const refreshConversations = useCallback(async () => {
    const area = contextRef.current.area?.trim();
    if (!area) {
      setConversations([]);
      return;
    }

    setIsLoadingConversations(true);
    try {
      const result = await listConversationsRequest({
        area,
        pageCode: contextRef.current.snapshotPageCode,
        limit: 50,
      });
      setConversations(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to list conversations.",
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations, context.area, context.snapshotPageCode]);

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
    setIsStreaming(false);
    setIsLoadingMessages(false);
  }, []);

  const selectConversation = useCallback(async (nextId: string) => {
    const area = contextRef.current.area?.trim();
    if (!area) {
      setError("Area is required for chat.");
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    setConversationId(nextId);
    setError(null);
    setInput("");
    setMessages([]);
    setIsStreaming(false);
    setIsLoadingMessages(true);

    try {
      const result = await getConversationMessagesRequest({
        conversationId: nextId,
        area,
      });
      setMessages(
        result.data.map((message) => ({
          id: createChatMessageId(),
          role: message.role,
          content: message.content,
        })),
      );
    } catch (err) {
      setMessages([]);
      setError(
        err instanceof Error ? err.message : "Failed to load conversation.",
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const deleteConversation = useCallback(
    async (targetId: string) => {
      const area = contextRef.current.area?.trim();
      if (!area) {
        setError("Area is required for chat.");
        return;
      }

      await deleteConversationRequest({
        conversationId: targetId,
        area,
      });

      setConversations((current) =>
        current.filter((item) => item.id !== targetId),
      );

      if (conversationIdRef.current === targetId) {
        startNewConversation();
      }
    },
    [startNewConversation],
  );

  const sendMessage = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || isStreaming) return;

      const area = contextRef.current.area?.trim();
      if (!area) {
        setError("Area is required for chat.");
        return;
      }

      const userMessage: ReportChatMessage = {
        id: createChatMessageId(),
        role: "user",
        content: text,
      };
      const assistantId = createChatMessageId();

      setInput("");
      setError(null);
      setIsStreaming(true);
      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      try {
        let activeConversationId = conversationIdRef.current;
        if (!activeConversationId) {
          const created = await createConversationRequest({
            area,
            pageCode: contextRef.current.snapshotPageCode,
          });
          activeConversationId = created.id;
          setConversationId(created.id);
          conversationIdRef.current = created.id;
          setConversations((current) => [created, ...current]);
        }

        const response = await openConversationStream({
          conversationId: activeConversationId,
          area,
          content: text,
          signal: controller.signal,
        });

        const finalContent = await readChatSseStream(
          response,
          {
            onToken: (_delta, fullText) => {
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? { ...message, content: fullText }
                    : message,
                ),
              );
            },
          },
          controller.signal,
        );

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: finalContent || "…" }
              : message,
          ),
        );

        await refreshConversations();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setMessages((current) =>
            current.filter(
              (message) =>
                message.id !== assistantId || message.content.trim().length > 0,
            ),
          );
          return;
        }

        const message =
          err instanceof Error ? err.message : "Chat request failed.";
        setError(message);
        setMessages((current) =>
          current.filter((item) => item.id !== assistantId),
        );
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setIsStreaming(false);
      }
    },
    [input, isStreaming, refreshConversations],
  );

  return {
    messages,
    input,
    setInput,
    isStreaming,
    isLoadingMessages,
    error,
    conversationId,
    conversations,
    isLoadingConversations,
    sendMessage,
    startNewConversation,
    selectConversation,
    deleteConversation,
    refreshConversations,
  };
}
