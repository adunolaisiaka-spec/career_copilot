import { requireAuth } from "@/lib/auth/helpers";
import { listConversations, getConversation } from "@/server/services/ai-copilot.service";
import { CopilotChat } from "@/components/copilot/copilot-chat";
import { Sparkles } from "lucide-react";

export default async function CopilotPage() {
  const user = await requireAuth();
  const conversations = await listConversations(user.id);
  const mostRecent = conversations[0];
  const initialConversation = mostRecent ? await getConversation(user.id, mostRecent.id) : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <Sparkles className="size-4.5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Career Copilot</h1>
          <p className="text-muted-foreground text-sm">
            Your intelligent partner for career growth.
          </p>
        </div>
      </div>

      <CopilotChat
        conversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          updatedAt: c.updatedAt.toISOString(),
        }))}
        initialConversationId={initialConversation?.id ?? null}
        initialMessages={
          initialConversation?.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })) ?? []
        }
      />
    </div>
  );
}
