import { UserRoundPlus, Sparkles, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: UserRoundPlus,
    title: "Build your profile",
    description: "Add your background, skills, and goals once — every AI feature grounds its answers in your real profile, never a guess.",
  },
  {
    icon: Sparkles,
    title: "Get AI-powered guidance",
    description: "Analyze your resume, match against jobs, generate cover letters, and prep for interviews with an assistant that knows your context.",
  },
  {
    icon: TrendingUp,
    title: "Track and move forward",
    description: "Manage every application on a visual pipeline, get reminded before interviews, and follow a roadmap toward your next role.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <p className="text-muted-foreground mt-1">Three steps from scattered job search to a guided plan.</p>
      </div>
      <div className="grid gap-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-2xl">
                <step.icon className="size-5" />
              </span>
              <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-[0.65rem] font-semibold">
                {i + 1}
              </span>
            </div>
            <h3 className="font-medium">{step.title}</h3>
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
