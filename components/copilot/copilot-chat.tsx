"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Bot, MessageSquarePlus, Send, Sparkles, User } from "lucide-react";
import { formatRelativeTime } from "@/lib/utilities/format-relative-time";

const MARKDOWN_COMPONENTS = {
  p: ({ ...props }) => <p className="[&:not(:first-child)]:mt-2" {...props} />,
  ul: ({ ...props }) => <ul className="mt-2 list-disc space-y-1 pl-4" {...props} />,
  ol: ({ ...props }) => <ol className="mt-2 list-decimal space-y-1 pl-4" {...props} />,
  a: ({ ...props }) => (
    <a className="underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
  ),
  code: ({ ...props }) => (
    <code className="bg-foreground/10 rounded px-1 py-0.5 text-[0.85em]" {...props} />
  ),
};

interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface Message {
  id?: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

interface CopilotChatProps {
  conversations: ConversationSummary[];
  initialConversationId: string | null;
  initialMessages: Message[];
}

const SUGGESTED_PROMPTS = [
  "Improve my career profile",
  "Review my applications",
  "What should I focus on this week?",
  "Help me prepare for an interview",
  "Find gaps in my current skills",
  "Create a career plan",
];

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full">
        <Bot className="size-4" />
      </span>
      <div className="bg-muted flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full" />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "USER";
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
            : "bg-muted rounded-tl-sm"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown components={MARKDOWN_COMPONENTS}>{message.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export function CopilotChat({
  conversations: initialConversations,
  initialConversationId,
  initialMessages,
}: CopilotChatProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const refreshConversations = async () => {
    const res = await fetch("/api/copilot/conversations");
    const body = await res.json().catch(() => null);
    if (res.ok) setConversations(body.data);
  };

  const selectConversation = async (id: string) => {
    setError(null);
    const res = await fetch(`/api/copilot/conversations/${id}`);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? "Couldn't load that conversation.");
      return;
    }
    setActiveId(id);
    setMessages(body.data.messages.map((m: Message) => ({ id: m.id, role: m.role, content: m.content })));
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setError(null);
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setError(null);
    setSending(true);
    setMessages((prev) => [...prev, { role: "USER", content: trimmed }]);
    setInput("");
    scrollToBottom();

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId ?? undefined, message: trimmed }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setMessages((prev) => [...prev, { role: "ASSISTANT", content: body.data.reply }]);
      const isNewConversation = !activeId;
      setActiveId(body.data.conversationId);
      setSending(false);
      scrollToBottom();
      // Refreshing the sidebar's conversation list (only needed once a new
      // conversation exists) happens after the reply is already visible and
      // `sending` is already cleared — it shouldn't hold the thinking
      // indicator up while it's in flight.
      if (isNewConversation) await refreshConversations();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:gap-6">
      <div className="flex shrink-0 flex-col gap-2 sm:w-56">
        <Button type="button" size="sm" onClick={startNewChat} className="justify-start">
          <MessageSquarePlus className="size-4" />
          New chat
        </Button>
        <div className="flex flex-col gap-0.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectConversation(c.id)}
              className={`flex flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                c.id === activeId ? "bg-accent" : "hover:bg-muted"
              }`}
            >
              <span
                className={`truncate text-sm ${c.id === activeId ? "text-accent-foreground font-medium" : ""}`}
              >
                {c.title || "New conversation"}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatRelativeTime(c.updatedAt)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Card className="flex min-h-[32rem] flex-1 flex-col overflow-hidden py-0">
        <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 py-8 text-center">
              <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-2xl">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="font-medium">How can I help move your career forward?</p>
                <p className="text-muted-foreground text-sm">
                  Ask anything, or try one of these to get started.
                </p>
              </div>
              <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="border-border hover:border-primary/40 hover:bg-accent rounded-lg border px-3 py-2 text-left text-sm transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <MessageBubble key={m.id ?? i} message={m} />
              ))}
              {sending && <ThinkingIndicator />}
            </>
          )}
        </div>

        {error && <p className="text-destructive border-t px-5 py-2 text-sm">{error}</p>}

        <div className="flex items-end gap-2 border-t p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask Career Copilot..."
            rows={1}
            className="min-h-9 flex-1 resize-none"
          />
          <Button
            type="button"
            size="icon"
            disabled={sending || !input.trim()}
            onClick={() => sendMessage(input)}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
