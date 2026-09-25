import { Card, CardContent } from "@/components/ui/card";
import { Bot, FileText, Search, Briefcase, MessagesSquare, Map } from "lucide-react";

const FEATURES = [
  {
    icon: Bot,
    title: "AI Career Copilot",
    description: "A conversational assistant grounded in your real profile — ask about your next move, not generic advice.",
  },
  {
    icon: FileText,
    title: "Resume analyzer",
    description: "Upload a resume and get an AI-scored breakdown with concrete, content-aware recommendations.",
  },
  {
    icon: Search,
    title: "Job search",
    description: "Search and filter roles, with live listings synced daily alongside curated postings.",
  },
  {
    icon: Briefcase,
    title: "Application tracker",
    description: "A visual pipeline from saved to offer, with drag-and-drop status changes and interview dates.",
  },
  {
    icon: MessagesSquare,
    title: "Interview prep",
    description: "AI-generated practice questions for the role you're targeting, with feedback on your answers.",
  },
  {
    icon: Map,
    title: "Career roadmap",
    description: "Turn a career goal into a phased plan with milestones, grounded in your actual experience.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="bg-muted/30 py-16">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Everything your job search needs</h2>
          <p className="text-muted-foreground mt-1">One place, not six tabs and a spreadsheet.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex flex-col gap-2.5">
                <span className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-lg">
                  <feature.icon className="size-4.5" />
                </span>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
