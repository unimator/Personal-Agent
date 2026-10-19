"use client";

import { useReducer, useRef } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatState = {
  messages: ChatMessage[];
  draft: string;
  isSending: boolean;
  error: string | null;
};

type ChatAction =
  | { type: "draft_changed"; draft: string }
  | { type: "request_started"; userMessage: ChatMessage; assistantMessage: ChatMessage }
  | { type: "response_delta"; assistantId: string; content: string }
  | { type: "request_finished" }
  | { type: "request_failed"; error: string };

const initialState: ChatState = {
  messages: [],
  draft: "",
  isSending: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "draft_changed":
      return { ...state, draft: action.draft };
    case "request_started":
      return {
        ...state,
        draft: "",
        isSending: true,
        error: null,
        messages: [...state.messages, action.userMessage, action.assistantMessage],
      };
    case "response_delta":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.assistantId
            ? { ...message, content: message.content + action.content }
            : message,
        ),
      };
    case "request_finished":
      return { ...state, isSending: false };
    case "request_failed":
      return { ...state, isSending: false, error: action.error };
  }
}

function errorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "detail" in detail) {
    return String(detail.detail);
  }
  return "The chat server could not complete the request.";
}

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const sending = useRef(false);

  async function sendMessage(event?: { preventDefault: () => void }) {
    event?.preventDefault();
    const content = state.draft.trim();
    if (!content || sending.current) return;

    sending.current = true;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    const messages = [...state.messages, userMessage]
      .filter((message) => message.role === "user" || message.content.trim().length > 0)
      .map(({ role, content: text }) => ({ role, content: text }));
    dispatch({ type: "request_started", userMessage, assistantMessage });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        let detail: unknown;
        try {
          detail = await response.json();
        } catch {
          detail = response.statusText;
        }
        throw new Error(errorMessage(detail));
      }
      if (!response.body) throw new Error("The chat server returned no response stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processLine = (line: string) => {
        if (!line.trim()) return;
        const event: { response?: unknown; error?: unknown } = JSON.parse(line);
        if (typeof event.error === "string") throw new Error(event.error);
        if (typeof event.response === "string") {
          dispatch({
            type: "response_delta",
            assistantId: assistantMessage.id,
            content: event.response,
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) processLine(line);
        if (done) break;
      }
      processLine(buffer);
    } catch (error) {
      dispatch({
        type: "request_failed",
        error: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      sending.current = false;
      dispatch({ type: "request_finished" });
    }
  }

  return {
    ...state,
    setDraft: (draft: string) => dispatch({ type: "draft_changed", draft }),
    sendMessage,
  };
}
