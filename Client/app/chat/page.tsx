"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "./useChat";

export default function Chat() {
  const { messages, draft, isSending, error, setDraft, sendMessage } = useChat();

  return (
    <main className="flex h-screen flex-col bg-white text-zinc-900">
      <header className="shrink-0 border-b border-zinc-200 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Home
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Chat</h1>
      </header>

      <section
        aria-label="Conversation"
        aria-live="polite"
        className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6"
      >
        {messages.length === 0 ? (
          <p className="mx-auto mt-12 max-w-3xl text-center text-zinc-500">
            Start a conversation
          </p>
        ) : (
          <ol className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {messages.map((message) => (
              <li
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "self-end whitespace-pre-wrap break-words bg-zinc-900 text-white"
                    : "self-start break-words bg-zinc-100 text-zinc-900"
                }`}
              >
                <p className="mb-1 text-xs font-medium opacity-60">
                  {message.role === "user" ? "You" : "Assistant"}
                </p>
                {message.role === "assistant" && message.content ? (
                  <div className="chat-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.content || (isSending ? "…" : "No response received.")
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="shrink-0 border-t border-zinc-200 p-4">
        {error && (
          <p role="alert" className="mx-auto mb-3 max-w-3xl text-sm text-red-700">
            {error}
          </p>
        )}
        <form onSubmit={sendMessage} className="mx-auto flex max-w-3xl gap-2">
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <input
            id="message"
            name="message"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-4 py-3 outline-none placeholder:text-zinc-400 focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
