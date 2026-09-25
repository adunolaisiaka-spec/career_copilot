import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Briefcase, MessagesSquare, Target, FileText } from "lucide-react";

export function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pt-16 pb-8 text-center sm:pt-24">
      <div className="flex flex-col items-center gap-5">
        <span className="text-primary bg-accent flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <Sparkles className="size-3.5" />
          Your intelligent partner for career growth
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Your career. Intelligently guided.
        </h1>
        <p className="text-muted-foreground max-w-xl text-balance sm:text-lg">
          Career Copilot brings your resume, job search, applications, and interview prep into one
          AI-guided command center — so every step of your job search has a clear next move.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={isAuthenticated ? "/dashboard" : "/register"} className={buttonVariants({ size: "lg" })}>
          {isAuthenticated ? "Go to dashboard" : "Start your career journey"}
        </Link>
        <Link
          href={isAuthenticated ? "/copilot" : "/login"}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          {isAuthenticated ? "Open Career Copilot" : "Log in"}
        </Link>
      </div>

      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="mt-4 grid w-full max-w-3xl grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
      <div className="order-2 flex flex-col gap-3 sm:order-1">
        <MiniStatCard icon={FileText} label="Resume score" value="84" />
        <MiniStatCard icon={Briefcase} label="Applications tracked" value="12" />
      </div>

      <Card className="order-1 sm:order-2 sm:w-64">
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-2xl">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Career Copilot</p>
            <p className="text-muted-foreground text-xs">
              &ldquo;Focus on closing the two open interviews this week.&rdquo;
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="order-3 flex flex-col gap-3">
        <MiniStatCard icon={MessagesSquare} label="Interviews upcoming" value="2" />
        <Card size="sm">
          <CardContent className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Target className="text-primary size-3.5" />
              Senior Frontend Role
            </div>
            <Progress value={60} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-2.5">
        <span className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </span>
        <div className="text-left">
          <div className="text-lg font-semibold">{value}</div>
          <div className="text-muted-foreground text-xs">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
