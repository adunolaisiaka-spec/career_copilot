"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

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

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setError(null);
    setSending(true);
    setMessages((prev) => [...prev, { role: "USER", content }]);
    setInput("");

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId ?? undefined, message: content }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setMessages((prev) => [...prev, { role: "ASSISTANT", content: body.data.reply }]);
      const isNewConversation = !activeId;
      setActiveId(body.data.conversationId);
      if (isNewConversation) await refreshConversations();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex flex-col gap-2 sm:w-48 sm:shrink-0">
        <Button type="button" variant="outline" size="sm" onClick={startNewChat}>
          New chat
        </Button>
        <div className="flex flex-col gap-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectConversation(c.id)}
              className={`truncate rounded-md px-2 py-1.5 text-left text-sm ${
                c.id === activeId ? "bg-muted font-medium" : "hover:bg-muted/50"
              }`}
            >
              {c.title || "New conversation"}
            </button>
          ))}
        </div>
      </div>

      <Card className="flex-1">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex min-h-64 flex-col gap-3">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Ask a question to get started — e.g. &quot;What should I focus on in my job
                search?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={m.id ?? i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "USER"
                    ? "bg-primary text-primary-foreground self-end"
                    : "bg-muted self-start"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask Career Copilot..."
              rows={2}
              className="flex-1"
            />
            <Button type="button" disabled={sending || !input.trim()} onClick={sendMessage}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
