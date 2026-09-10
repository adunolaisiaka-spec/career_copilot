import { requireAuth } from "@/lib/auth/helpers";
import { listConversations, getConversation } from "@/server/services/ai-copilot.service";
import { CopilotChat } from "@/components/copilot/copilot-chat";

export default async function CopilotPage() {
  const user = await requireAuth();
  const conversations = await listConversations(user.id);
  const mostRecent = conversations[0];
  const initialConversation = mostRecent ? await getConversation(user.id, mostRecent.id) : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Career Copilot</h1>
        <p className="text-muted-foreground text-sm">
          Ask about your resume, job search, or career plans.
        </p>
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
